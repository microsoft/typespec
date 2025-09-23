import { printIdentifier } from "@typespec/compiler";
import { OpenAPI3Schema, OpenAPISchema3_1, Refable } from "../../../../types.js";
import {
  TypeSpecDataTypes,
  TypeSpecDecorator,
  TypeSpecEnum,
  TypeSpecModelProperty,
  TypeSpecUnion,
} from "../interfaces.js";
import { Context } from "../utils/context.js";
import { getDecoratorsForSchema } from "../utils/decorators.js";
import { getScopeAndName } from "../utils/get-scope-and-name.js";

/**
 * Transforms #/components/schemas into TypeSpec models.
 * Populates the provided `models` array in-place.
 * @param models
 * @param schemas
 * @returns
 */
export function transformComponentSchemas(context: Context, models: TypeSpecDataTypes[]): void {
  const schemas = context.openApi3Doc.components?.schemas;
  if (!schemas) return;

  for (const name of Object.keys(schemas)) {
    const schema = schemas[name];
    transformComponentSchema(models, name, context, schema);
  }

  return;
  function transformComponentSchema(
    types: TypeSpecDataTypes[],
    name: string,
    context: Context,
    schema: OpenAPI3Schema,
  ): void {
    const kind = getTypeSpecKind(schema);
    switch (kind) {
      case "alias":
        return populateAlias(types, name, schema);
      case "enum":
        return populateEnum(types, name, schema);
      case "model":
        return populateModel(types, name, context, schema);
      case "union":
        return populateUnion(types, name, schema);
      case "scalar":
        return populateScalar(types, name, schema);
    }
  }

  function populateAlias(
    types: TypeSpecDataTypes[],
    rawName: string,
    schema: Refable<OpenAPI3Schema>,
  ): void {
    if (!("$ref" in schema)) {
      return;
    }

    const { name, scope } = getScopeAndName(rawName);

    types.push({
      kind: "alias",
      name,
      scope,
      doc: schema.description,
      ref: context.getRefName(schema.$ref, scope),
    });
  }

  function populateEnum(types: TypeSpecDataTypes[], name: string, schema: OpenAPI3Schema): void {
    const tsEnum: TypeSpecEnum = {
      kind: "enum",
      ...getScopeAndName(name),
      decorators: getDecoratorsForSchema(schema),
      doc: schema.description,
      schema,
    };

    types.push(tsEnum);
  }

  function populateModel(
    types: TypeSpecDataTypes[],
    rawName: string,
    context: Context,
    schema: OpenAPI3Schema,
  ): void {
    const { name, scope } = getScopeAndName(rawName);
    const allOfDetails = getAllOfDetails(schema, scope);
    const isParent = getModelIs(schema, scope);
    const refName = `#/components/schemas/${rawName}`;
    const isModelReferencedAsMultipartRequestBody =
      context.isSchemaReferenceRegisteredForMultipartForm(refName);
    const encoding = isModelReferencedAsMultipartRequestBody
      ? context.getMultipartSchemaEncoding(refName)
      : undefined;
    types.push({
      kind: "model",
      name,
      scope,
      decorators: [...getDecoratorsForSchema(schema)],
      doc: schema.description,
      properties: [...getModelPropertiesFromObjectSchema(schema), ...allOfDetails.properties],
      additionalProperties:
        typeof schema.additionalProperties === "object" ? schema.additionalProperties : undefined,
      extends: allOfDetails.extends,
      is: isParent,
      type: schema.type,
      spread: allOfDetails.spread,
      isModelReferencedAsMultipartRequestBody,
      encoding,
    });
  }

  function populateUnion(types: TypeSpecDataTypes[], name: string, schema: OpenAPI3Schema): void {
    // Extract description and decorators from meaningful union members
    const unionMetadata = extractUnionMetadata(schema);

    const union: TypeSpecUnion = {
      kind: "union",
      ...getScopeAndName(name),
      decorators: [...getDecoratorsForSchema(schema), ...unionMetadata.decorators],
      doc: schema.description ?? unionMetadata.description,
      schema,
    };

    types.push(union);
  }

  /**
   * Extracts meaningful description and decorators from union members.
   * Handles anyOf/oneOf with null, and type arrays like ["string", "null"].
   */
  function extractUnionMetadata(schema: OpenAPI3Schema | OpenAPISchema3_1): {
    description?: string;
    decorators: TypeSpecDecorator[];
  } {
    // Handle anyOf/oneOf scenarios
    const unionMembers = schema.anyOf || schema.oneOf;
    if (unionMembers) {
      const meaningfulMembers = unionMembers.filter((member) => {
        if ("$ref" in member) return true; // Reference is meaningful
        return member.type !== "null"; // Non-null types are meaningful
      });

      // If we have exactly one meaningful member and at least one null, extract from the meaningful one
      if (meaningfulMembers.length === 1 && unionMembers.length > meaningfulMembers.length) {
        const meaningfulMember = meaningfulMembers[0];
        if (!("$ref" in meaningfulMember)) {
          return {
            description: meaningfulMember.description,
            decorators: getDecoratorsForSchema(meaningfulMember),
          };
        }
      }
    }

    // Handle type array scenarios like type: ["string", "null"]
    if (Array.isArray(schema.type)) {
      const nonNullTypes = schema.type.filter((t) => t !== "null");
      // If we have exactly one non-null type, this is essentially a nullable version of that type
      // The schema itself should contain the relevant constraints/description for the non-null type
      if (nonNullTypes.length === 1) {
        // Create a schema without the null type to extract decorators for the non-null part
        const nonNullSchema = { ...schema, type: nonNullTypes[0] };
        return { decorators: getDecoratorsForSchema(nonNullSchema) };
        // The description should already be on the main schema, so we don't override it here
      }
    }

    return { decorators: [] };
  }

  function populateScalar(types: TypeSpecDataTypes[], name: string, schema: OpenAPI3Schema): void {
    types.push({
      kind: "scalar",
      ...getScopeAndName(name),
      decorators: getDecoratorsForSchema(schema),
      doc: schema.description,
      schema,
    });
  }

  interface AllOfDetails {
    extends?: string;
    properties: TypeSpecModelProperty[];
    spread: string[];
  }
  function getAllOfDetails(schema: OpenAPI3Schema, callingScope: string[]): AllOfDetails {
    const details: AllOfDetails = {
      spread: [],
      properties: [],
    };

    if (!schema.allOf) {
      return details;
    }

    let foundParentWithDiscriminator = false;

    for (const member of schema.allOf) {
      // inline-schemas treated as normal objects with properties
      if (!("$ref" in member)) {
        details.properties.push(...getModelPropertiesFromObjectSchema(member));
        continue;
      }

      const refSchema = context.getSchemaByRef(member.$ref);

      // Inheritance only supported if parent has a discriminator defined, otherwise prefer
      // composition via spreading.
      if (!refSchema?.discriminator) {
        details.spread.push(context.getRefName(member.$ref, callingScope));
        continue;
      }

      if (!foundParentWithDiscriminator) {
        details.extends = context.getRefName(member.$ref, callingScope);
        foundParentWithDiscriminator = true;
        continue;
      }

      // can only extend once, so if we have multiple potential parents, spread them all
      // user will need to resolve TypeSpec errors (e.g. duplicate fields) manually
      if (details.extends) {
        details.spread.push(details.extends);
        details.extends = undefined;
      }

      details.spread.push(context.getRefName(member.$ref, callingScope));
    }

    return details;
  }

  function getModelIs(schema: OpenAPI3Schema, callingScope: string[]): string | undefined {
    if (schema.type !== "array") {
      return;
    }
    return context.generateTypeFromRefableSchema(schema, callingScope);
  }
}

function getModelPropertiesFromObjectSchema({
  properties,
  required = [],
}: OpenAPI3Schema): TypeSpecModelProperty[] {
  if (!properties) return [];

  const modelProperties: TypeSpecModelProperty[] = [];
  for (const name of Object.keys(properties)) {
    const property = properties[name];

    modelProperties.push({
      name: printIdentifier(name),
      doc: property.description,
      schema: property,
      isOptional: !required.includes(name),
      decorators: [...getDecoratorsForSchema(property)],
    });
  }

  return modelProperties;
}

function getTypeSpecKind(schema: OpenAPI3Schema): TypeSpecDataTypes["kind"] {
  if ("$ref" in schema) {
    return "alias";
  }

  if (schema.enum && schema.type === "string" && !schema.nullable) {
    return "enum";
  } else if (
    schema.anyOf ||
    schema.oneOf ||
    schema.enum ||
    schema.nullable ||
    (Array.isArray(schema.type) && schema.type.includes("null"))
  ) {
    return "union";
  } else if (
    schema.type === "object" ||
    (schema.properties && Object.keys(schema.properties).length > 0) ||
    schema.type === "array" ||
    schema.items ||
    schema.allOf
  ) {
    return "model";
  }

  return "scalar";
}
