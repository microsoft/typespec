import { printIdentifier } from "@typespec/compiler";
import { OpenAPI3Encoding, Refable, SupportedOpenAPISchema } from "../../../../types.js";
import {
  TypeSpecAlias,
  TypeSpecDataTypes,
  TypeSpecEnum,
  TypeSpecModel,
  TypeSpecModelProperty,
  TypeSpecScalar,
  TypeSpecUnion,
} from "../interfaces.js";
import { Context } from "../utils/context.js";
import { getDecoratorsForSchema } from "../utils/decorators.js";
import { generateDocs } from "../utils/docs.js";
import { generateDecorators } from "./generate-decorators.js";
import {
  getTypeSpecPrimitiveFromSchema,
  isReferencedEnumType,
  isReferencedUnionType,
  SchemaToExpressionGenerator,
} from "./generate-types.js";

const SSE_TERMINAL_EVENT_EXTENSION = "x-ms-sse-terminal-event";

export function generateDataType(type: TypeSpecDataTypes, context: Context): string {
  switch (type.kind) {
    case "alias":
      return generateAlias(type, context);
    case "enum":
      return generateEnum(type);
    case "model":
      return generateModel(type, context);
    case "scalar":
      return generateScalar(type, context);
    case "union":
      return generateUnion(type, context);
  }
}

function generateAlias(alias: TypeSpecAlias, context: Context): string {
  // Since aliases are not represented in the TypeGraph,
  // generate a model so that the model name is present in emitted OpenAPI3.
  // May revisit to allow emitting actual alias.
  const sourceModel = context.getRefName(alias.ref, alias.scope);
  return `model ${alias.name} is ${sourceModel};`;
}

function generateEnum(tsEnum: TypeSpecEnum): string {
  const definitions: string[] = [];

  if (tsEnum.doc) {
    definitions.push(generateDocs(tsEnum.doc));
  }

  definitions.push(...generateDecorators(tsEnum.decorators));
  definitions.push(`enum ${tsEnum.name} {`);

  const schema = tsEnum.schema;

  if (schema.enum) {
    definitions.push(...schema.enum.map((e) => `${JSON.stringify(e)},`));
  }

  definitions.push("}");

  return definitions.join("\n");
}

function generateScalar(scalar: TypeSpecScalar, context: Context): string {
  const definitions: string[] = [];

  if (scalar.doc) {
    definitions.push(generateDocs(scalar.doc));
  }

  definitions.push(...generateDecorators(scalar.decorators));
  const type = context.generateTypeFromRefableSchema(scalar.schema, scalar.scope);

  if (type === "unknown") {
    definitions.push(`scalar ${scalar.name};`);
  } else {
    definitions.push(`scalar ${scalar.name} extends ${type};`);
  }

  return definitions.join("\n");
}

function generateUnion(union: TypeSpecUnion, context: Context): string {
  const definitions: string[] = [];

  if (union.doc) {
    definitions.push(generateDocs(union.doc));
  }

  definitions.push(...generateDecorators(union.decorators));

  definitions.push(`union ${union.name} {`);

  const schema = union.schema;

  const getVariantName = (member: Refable<SupportedOpenAPISchema>) => {
    if (union.schema.discriminator === undefined) {
      return "";
    }

    const memberSchema = "$ref" in member ? context.getSchemaByRef(member.$ref)! : member;

    const value =
      (union.schema.discriminator?.mapping && "$ref" in member
        ? Object.entries(union.schema.discriminator.mapping).find((x) => x[1] === member.$ref)?.[0]
        : undefined) ??
      (memberSchema.properties?.[union.schema.discriminator.propertyName] as any)?.enum?.[0];
    // checking whether the value is using an invalid character as an identifier
    const valueIdentifier = value ? printIdentifier(value, "disallow-reserved") : "";
    return value ? `${value === valueIdentifier ? value : valueIdentifier}: ` : "";
  };
  if (schema.enum) {
    definitions.push(...schema.enum.map((e) => `${JSON.stringify(e)},`));
  } else if (schema.oneOf) {
    // Check if this is an SSE event union
    const isSSEEventUnion = union.decorators.some(
      (d) => d.name === "TypeSpec.Events.events" || d.name === "events",
    );

    if (isSSEEventUnion) {
      // Generate SSE event variants: eventName: DataType,
      // Sort so terminal events come last
      const sortedMembers = [...schema.oneOf].sort((a, b) => {
        const aSchema = "$ref" in a ? context.getSchemaByRef(a.$ref) : a;
        const bSchema = "$ref" in b ? context.getSchemaByRef(b.$ref) : b;

        const aIsTerminal = !!aSchema?.[SSE_TERMINAL_EVENT_EXTENSION];
        const bIsTerminal = !!bSchema?.[SSE_TERMINAL_EVENT_EXTENSION];

        if (aIsTerminal && !bIsTerminal) return 1; // a comes after b
        if (!aIsTerminal && bIsTerminal) return -1; // a comes before b
        return 0; // maintain original order for same type
      });

      definitions.push(
        ...sortedMembers.map((member) => {
          try {
            const memberSchema = "$ref" in member ? context.getSchemaByRef(member.$ref) : member;
            if (!memberSchema || typeof memberSchema !== "object" || !memberSchema.properties) {
              // Fallback to regular generation if we can't parse the event structure
              return (
                getVariantName(member) +
                context.generateTypeFromRefableSchema(member, union.scope) +
                ","
              );
            }

            // Use any to access properties since the types are complex
            const props = memberSchema.properties as any;

            // Extract event name from event.const
            let eventName: string | undefined;
            if (props.event) {
              const eventProp = props.event;
              if (eventProp.const) {
                eventName = eventProp.const;
              } else if (eventProp.enum && eventProp.enum[0]) {
                eventName = eventProp.enum[0];
              }
            }

            // Check for terminal events or special cases
            if (!eventName) {
              // Check if this is a terminal event (no event name, just data)
              if (props.data?.const) {
                const terminalValue = props.data.const;
                const isTerminal = memberSchema[SSE_TERMINAL_EVENT_EXTENSION];
                const contentType = props.data?.contentMediaType;

                let decorators = "";
                if (contentType) {
                  decorators += `\n  @TypeSpec.Events.contentType("${contentType}")`;
                }
                if (isTerminal) {
                  decorators += `\n  @TypeSpec.SSE.terminalEvent`;
                  decorators += `\n  @extension("${SSE_TERMINAL_EVENT_EXTENSION}", true)`;
                }

                return `${decorators}\n  "${terminalValue}",`;
              }
              // Fallback to regular generation
              return (
                getVariantName(member) +
                context.generateTypeFromRefableSchema(member, union.scope) +
                ","
              );
            }

            // Extract data type and content type from data.contentSchema
            let dataType = "unknown";
            let contentType: string | undefined;

            if (props.data) {
              const dataProp = props.data;

              // Get content type if specified
              if (dataProp.contentMediaType) {
                contentType = dataProp.contentMediaType;
              }

              // Check for contentSchema (OpenAPI extension)
              if (dataProp.contentSchema) {
                const contentSchema = dataProp.contentSchema;
                // Special handling for byte data which should map to Base64/bytes
                if (
                  contentSchema &&
                  typeof contentSchema === "object" &&
                  contentSchema.type === "object" &&
                  contentSchema.properties?.data
                ) {
                  const dataProperty = contentSchema.properties.data as any;
                  if (dataProperty?.type === "string" && dataProperty?.format === "byte") {
                    dataType = "Base64";
                  } else {
                    dataType = context.generateTypeFromRefableSchema(
                      dataProp.contentSchema,
                      union.scope,
                    );
                  }
                } else {
                  dataType = context.generateTypeFromRefableSchema(
                    dataProp.contentSchema,
                    union.scope,
                  );
                }
              } else if (dataProp.type) {
                // Simple type like string
                dataType = dataProp.type;
              }
            }

            // Build decorators for this event variant
            let decorators = "";
            if (contentType && contentType !== "application/json") {
              decorators += `\n  @TypeSpec.Events.contentType("${contentType}")`;
            }

            // Check if this is a terminal event
            const isTerminal = (memberSchema as any)[SSE_TERMINAL_EVENT_EXTENSION];
            if (isTerminal) {
              decorators += `\n  @TypeSpec.SSE.terminalEvent`;
              decorators += `\n  @extension("${SSE_TERMINAL_EVENT_EXTENSION}", true)`;
            }

            return `${decorators}\n  ${eventName}: ${dataType},`;
          } catch (error) {
            // If any error occurs, fall back to regular generation
            return (
              getVariantName(member) +
              context.generateTypeFromRefableSchema(member, union.scope) +
              ","
            );
          }
        }),
      );
    } else {
      // Regular union generation
      definitions.push(
        ...schema.oneOf.map(
          (member) =>
            getVariantName(member) +
            context.generateTypeFromRefableSchema(member, union.scope) +
            ",",
        ),
      );
    }
  } else if (schema.anyOf) {
    definitions.push(
      ...schema.anyOf.map(
        (member) =>
          getVariantName(member) + context.generateTypeFromRefableSchema(member, union.scope) + ",",
      ),
    );
  } else if (
    Array.isArray(schema.type) &&
    schema.type.length === 2 &&
    schema.type.includes("null")
  ) {
    // Handle OpenAPI 3.1 type arrays like ["integer", "null"]
    // Only handle the case of exactly 2 types where one is "null"
    for (const t of schema.type) {
      if (t === "null") {
        definitions.push("null,");
      } else {
        // Create a schema with a single type to reuse existing logic
        const singleTypeSchema = { ...schema, type: t as any, nullable: undefined };
        const type = context.generateTypeFromRefableSchema(singleTypeSchema, union.scope);
        definitions.push(`${type},`);
      }
    }
  } else {
    // check if it's a primitive type
    const primitiveType = getTypeSpecPrimitiveFromSchema(schema);
    if (primitiveType) {
      definitions.push(`${primitiveType},`);
    } else if (schema.type === "array" || schema.items) {
      // For arrays, we'll create a non-nullable schema and let the union itself handle
      // the nullability of the schema overall.
      const schemaWithoutNullable = { ...schema, nullable: undefined };
      const arrayType = context.generateTypeFromRefableSchema(schemaWithoutNullable, union.scope);
      definitions.push(`${arrayType},`);
    }
  }

  if ("nullable" in schema && schema.nullable) {
    definitions.push("null,");
  }

  definitions.push("}");

  return definitions.join("\n");
}

function generateModel(model: TypeSpecModel, context: Context): string {
  const definitions: string[] = [];
  const modelDeclaration = generateModelDeclaration(model);

  if (model.doc) {
    definitions.push(generateDocs(model.doc));
  }

  definitions.push(...generateDecorators(model.decorators));
  definitions.push(modelDeclaration.open);

  if (model.spread?.length) {
    definitions.push(...model.spread.map((spread) => `...${spread};`));
  }

  definitions.push(
    ...model.properties.map((prop) =>
      generateModelProperty(
        prop,
        model.scope,
        context,
        model.isModelReferencedAsMultipartRequestBody,
        model.encoding,
      ),
    ),
  );

  if (model.additionalProperties) {
    definitions.push(
      `...Record<${context.generateTypeFromRefableSchema(model.additionalProperties, model.scope)}>;`,
    );
  }

  if (modelDeclaration.close) definitions.push(modelDeclaration.close);

  return definitions.join("\n");
}

export function generateModelProperty(
  prop: TypeSpecModelProperty,
  containerScope: string[],
  context: Context,
  isModelReferencedAsMultipartRequestBody?: boolean,
  encoding?: Record<string, OpenAPI3Encoding>,
): string {
  const propertyType = context.generateTypeFromRefableSchema(prop.schema, containerScope);

  // Decorators will be a combination of top-level (parameters) and
  // schema-level decorators.
  const decorators = generateDecorators(
    [...prop.decorators, ...getDecoratorsForSchema(prop.schema)],
    isModelReferencedAsMultipartRequestBody
      ? SchemaToExpressionGenerator.decoratorNamesToExcludeForParts
      : [],
  ).join(" ");

  const isEnumType = isReferencedEnumType(prop.schema, context);
  const isUnionType = isReferencedUnionType(prop.schema, context);

  const doc = prop.doc ? generateDocs(prop.doc) : "";

  return `${doc}${decorators} ${prop.name}${prop.isOptional ? "?" : ""}: ${context.getPartType(propertyType, prop.name, isModelReferencedAsMultipartRequestBody ?? false, encoding, isEnumType, isUnionType)};`;
}

export function generateModelExpression(
  props: TypeSpecModelProperty[],
  containerScope: string[],
  context: Context,
): string {
  return `{ ${props.map((prop) => generateModelProperty(prop, containerScope, context)).join(" ")} }`;
}

type ModelDeclarationOutput = { open: string; close?: string };

function generateModelDeclaration(model: TypeSpecModel): ModelDeclarationOutput {
  const modelName = model.name;

  if (model.is) {
    return { open: `model ${modelName} is ${model.is};` };
  }

  if (model.extends) {
    return { open: `model ${modelName} extends ${model.extends} {`, close: "}" };
  }

  return { open: `model ${modelName} {`, close: "}" };
}
