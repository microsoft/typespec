import { printIdentifier } from "@typespec/compiler";
import {
  OpenAPI3Encoding,
  OpenAPI3Schema,
  OpenAPI3SchemaProperty,
  Refable,
} from "../../../../types.js";
import { Context } from "../utils/context.js";
import {
  getDecoratorsForSchema,
  normalizeObjectValueToTSValueExpression,
} from "../utils/decorators.js";
import { getScopeAndName } from "../utils/get-scope-and-name.js";
import { generateDecorators } from "./generate-decorators.js";

export class SchemaToExpressionGenerator {
  constructor(public rootNamespace: string) {}

  public generateTypeFromRefableSchema(
    schema: Refable<OpenAPI3Schema>,
    callingScope: string[],
    isHttpPart = false,
    encoding?: Record<string, OpenAPI3Encoding>,
    context?: Context,
  ): string {
    const hasRef = "$ref" in schema;
    return hasRef
      ? this.getRefName(schema.$ref, callingScope)
      : this.getTypeFromSchema(schema, callingScope, isHttpPart, encoding, context);
  }

  public generateArrayType(schema: OpenAPI3Schema, callingScope: string[]): string {
    const items = schema.items;
    if (!items) {
      return "unknown[]";
    }

    if ("$ref" in items) {
      return `${this.getRefName(items.$ref, callingScope)}[]`;
    }

    // Prettier will get rid of the extra parenthesis for us
    return `(${this.getTypeFromSchema(items, callingScope)})[]`;
  }

  public getRefName(ref: string, callingScope: string[]): string {
    const { scope, name } = this.getRefScopeAndName(ref, callingScope);
    return [...scope, name].join(".");
  }

  private getRefScopeAndName(
    ref: string,
    callingScope: string[],
  ): ReturnType<typeof getScopeAndName> {
    const parts = ref.split("/");
    const name = parts.pop() ?? "";
    const componentType = parts.pop()?.toLowerCase() ?? "";
    const scopeAndName = getScopeAndName(name);

    switch (componentType) {
      case "schemas":
        if (callingScope.length) {
          /* 
            Since schemas are generated in the file namespace,
            need to reference them against the file namespace
            to prevent name collisions.
            Example:
              namespace Service;
              scalar Foo extends string;
              namespace Parameters {
                model Foo {
                  @query foo: Service.Foo
                }      
              }
          */
          scopeAndName.scope.unshift(this.rootNamespace);
        }
        break;
      case "parameters":
        scopeAndName.scope.unshift("Parameters");
        break;
    }

    return scopeAndName;
  }

  private getTypeFromSchema(
    schema: OpenAPI3Schema,
    callingScope: string[],
    isHttpPart = false,
    encoding?: Record<string, OpenAPI3Encoding>,
    context?: Context,
  ): string {
    let type = "unknown";

    // Handle OpenAPI 3.1 type arrays like ["integer", "null"]
    // Only handle the case of exactly 2 types where one is "null"
    if (Array.isArray(schema.type) && schema.type.length === 2 && schema.type.includes("null")) {
      const types: string[] = [];
      for (const t of schema.type) {
        if (t === "null") {
          types.push("null");
        } else {
          // Create a schema with a single type to reuse existing type extraction logic
          // Remove type array, nullable, and default to avoid double-processing
          const singleTypeSchema: OpenAPI3Schema = {
            ...schema,
            type: t as any,
            nullable: undefined,
            default: undefined,
          };
          types.push(
            this.getTypeFromSchema(singleTypeSchema, callingScope, isHttpPart, encoding, context),
          );
        }
      }
      type = types.join(" | ");
    } else if (schema.const !== undefined) {
      type = JSON.stringify(schema.const);
    } else if (schema.enum) {
      type = getEnum(schema.enum);
    } else if (schema.anyOf?.length) {
      type = this.getAnyOfType(schema, callingScope);
    } else if (schema.allOf?.length) {
      type = this.getAllOfType(schema, callingScope);
    } else if (schema?.items) {
      // we should never test on type array as it's not required
      // but rather on the presence of a schema for items
      type = this.generateArrayType(schema, callingScope);
    } else if (schema.type === "boolean") {
      type = "boolean";
    } else if ((schema as any).type === "null") {
      type = "null";
    } else if (schema.type === "integer") {
      type = getIntegerType(schema);
    } else if (schema.type === "number") {
      type = getNumberType(schema);
    } else if (
      (schema?.properties && Object.keys(schema.properties).length) ||
      schema?.additionalProperties
    ) {
      // we should never test on type object as it's not required
      // but rather on the presence of properties which indicates an object type
      type = this.getObjectType(schema, callingScope, isHttpPart, encoding, context);
    } else if (schema.oneOf?.length) {
      type = this.getOneOfType(schema, callingScope);
    } else if (schema.type === "string") {
      type = getStringType(schema);
    } else if (schema.type === "object") {
      // this is a fallback to maintain compatibility and it needs to be in the last cases
      type = this.getObjectType(schema, callingScope, isHttpPart, encoding, context);
    } else if (schema.type === "array") {
      // this is a fallback to maintain compatibility and it needs to be in the last cases
      type = this.generateArrayType(schema, callingScope);
    }

    if (schema.nullable) {
      type += ` | null`;
    }

    // Check for default value - either at top level or from union members
    if (schema.default || schema.anyOf?.length || schema.oneOf?.length) {
      const defaultValue = this.generateDefaultValue(schema, callingScope, context);
      if (defaultValue) {
        type += ` = ${defaultValue}`;
      }
    }

    return type;
  }

  private generateDefaultValue(
    schema: OpenAPI3Schema,
    callingScope: string[],
    context?: Context,
  ): string | undefined {
    if (schema.default && typeof schema.default === "object") {
      return normalizeObjectValueToTSValueExpression(schema.default);
    }

    // If this schema has a top-level default, use it
    // Check if this is a union type (anyOf or oneOf) with a default value that might match an enum member
    if (context && schema.default && (schema.anyOf?.length || schema.oneOf?.length)) {
      const unionMembers = schema.anyOf || schema.oneOf || [];

      // Try to find an enum reference that contains this default value
      for (const member of unionMembers) {
        if ("$ref" in member) {
          const refSchema = context.getSchemaByRef(member.$ref);
          // This is an enum type, check if the default value matches any enum member
          if (
            refSchema?.enum &&
            refSchema.type === "string" &&
            refSchema.enum.includes(schema.default)
          ) {
            const enumRefName = this.getRefName(member.$ref, callingScope);
            // Convert the default value to a valid identifier for the enum member
            const memberName = printIdentifier(schema.default as string, "disallow-reserved");
            return `${enumRefName}.${memberName}`;
          }
        }
      }
    }

    // If this is a union type without a top-level default, find the first default from members
    if (schema.anyOf?.length || schema.oneOf?.length) {
      const unionMembers = schema.anyOf || schema.oneOf || [];

      for (const member of unionMembers) {
        if ("$ref" in member === false && member.default) {
          // Found a member with a default value, use it for the union
          if (member.default && typeof member.default === "object") {
            return normalizeObjectValueToTSValueExpression(member.default);
          }
          return JSON.stringify(member.default);
        }
      }
    }

    // Fallback if no default found - return a sentinel value to indicate no default
    if (schema.default) {
      return JSON.stringify(schema.default);
    }
    return undefined; // Return undefined to indicate no default found
  }

  private getAllOfType(schema: OpenAPI3Schema, callingScope: string[]): string {
    const requiredProps: string[] = schema.required || [];
    let properties: Record<string, Refable<OpenAPI3Schema>> = {};
    const baseTypes: string[] = [];

    for (const member of schema.allOf || []) {
      if ("$ref" in member) {
        // If it's a $ref, process it as inheritance/extension and add to the list
        baseTypes.push(this.getRefName(member.$ref, callingScope));
      } else if (member.properties) {
        properties = { ...properties, ...member.properties };
        if (member.required) {
          requiredProps.push(...member.required);
        }
      }
    }

    const props: string[] = [];
    for (const name of Object.keys(properties)) {
      const isOptional = !requiredProps.includes(name) ? "?" : "";
      props.push(
        `${printIdentifier(name)}${isOptional}: ${this.generateTypeFromRefableSchema(properties[name], callingScope)}`,
      );
    }

    if (baseTypes.length > 0 && props.length > 0) {
      // When there are both inherited types and properties
      return `${baseTypes.join(" & ")} & {${props.join("; ")}}`;
    } else if (baseTypes.length > 0) {
      // When there are only inherited types
      return baseTypes.join(" & ");
    } else {
      // When there are only properties
      return `{${props.join("; ")}}`;
    }
  }

  private stripDefaultsFromSchema(schema: Refable<OpenAPI3Schema>): Refable<OpenAPI3Schema> {
    if ("$ref" in schema) {
      return schema;
    }

    const strippedSchema = { ...schema };
    delete strippedSchema.default;

    // Recursively strip defaults from nested structures
    if (strippedSchema.items) {
      strippedSchema.items = this.stripDefaultsFromSchema(strippedSchema.items);
    }

    if (strippedSchema.anyOf) {
      strippedSchema.anyOf = strippedSchema.anyOf.map((item) => this.stripDefaultsFromSchema(item));
    }

    if (strippedSchema.oneOf) {
      strippedSchema.oneOf = strippedSchema.oneOf.map((item) => this.stripDefaultsFromSchema(item));
    }

    if (strippedSchema.allOf) {
      strippedSchema.allOf = strippedSchema.allOf.map((item) => this.stripDefaultsFromSchema(item));
    }

    if (strippedSchema.properties) {
      const strippedProperties: Record<string, Refable<OpenAPI3Schema>> = {};
      for (const [key, prop] of Object.entries(strippedSchema.properties)) {
        strippedProperties[key] = this.stripDefaultsFromSchema(prop);
      }
      strippedSchema.properties = strippedProperties;
    }

    if (
      strippedSchema.additionalProperties &&
      typeof strippedSchema.additionalProperties === "object"
    ) {
      strippedSchema.additionalProperties = this.stripDefaultsFromSchema(
        strippedSchema.additionalProperties,
      );
    }

    return strippedSchema;
  }

  private getAnyOfType(schema: OpenAPI3Schema, callingScope: string[]): string {
    const definitions: string[] = [];

    for (const item of schema.anyOf ?? []) {
      // Generate type without defaults for union members by recursively stripping all defaults
      const itemWithoutDefaults = this.stripDefaultsFromSchema(item);
      definitions.push(this.generateTypeFromRefableSchema(itemWithoutDefaults, callingScope));
    }

    return definitions.join(" | ");
  }

  private getOneOfType(schema: OpenAPI3Schema, callingScope: string[]): string {
    const definitions: string[] = [];

    for (const item of schema.oneOf ?? []) {
      // Generate type without defaults for union members by recursively stripping all defaults
      const itemWithoutDefaults = this.stripDefaultsFromSchema(item);
      definitions.push(this.generateTypeFromRefableSchema(itemWithoutDefaults, callingScope));
    }

    return definitions.join(" | ");
  }

  public getPartType(
    propType: string,
    name: string,
    isHttpPart: boolean,
    encoding: Record<string, OpenAPI3Encoding> | undefined,
    isEnumType: boolean,
    isUnionType: boolean,
  ): string {
    if (!isHttpPart) {
      return propType;
    }
    const propTypeWithoutDefault = propType.replace(/ = .*/, "");
    const propTypeWithoutNull = propTypeWithoutDefault.replace(/ \| null/g, "");
    const encodingForProperty = encoding?.[name];
    const filePartType =
      encodingForProperty?.contentType &&
      this.shouldUpgradeToFileDefinition(propTypeWithoutDefault, encodingForProperty.contentType)
        ? `File<"${encodingForProperty.contentType}">`
        : undefined;
    const contentTypeHeader =
      encodingForProperty?.contentType &&
      !filePartType &&
      !this.isDefaultPartType(propTypeWithoutNull, encodingForProperty.contentType) &&
      !this.isInlineUnionType(propTypeWithoutNull) &&
      !isUnionType &&
      !this.isScalarType(propTypeWithoutNull) &&
      !isEnumType
        ? ` & { @header contentType: "${encodingForProperty.contentType}" }`
        : "";
    return `HttpPart<${filePartType ?? propTypeWithoutDefault}${contentTypeHeader}>`;
  }

  private isInlineUnionType(partType: string): boolean {
    return partType.includes("|");
  }

  private isScalarType(partType: string): boolean {
    return (
      partType === "string" ||
      partType === "boolean" ||
      partType === "null" ||
      this.numericTypes[partType]
    );
  }

  private isDefaultPartType(partType: string, partMediaType: string): boolean {
    return (
      ((partType === "string" || this.numericTypes[partType]) && partMediaType === "text/plain") ||
      (partType === "bytes" && partMediaType === "application/octet-stream")
    );
  }

  private shouldUpgradeToFileDefinition(partType: string, partMediaType: string): boolean {
    return partType === "bytes" && !this.isDefaultPartType(partType, partMediaType);
  }
  private readonly numericTypes: Record<string, boolean> = {
    // https://typespec.io/docs/language-basics/built-in-types/
    numeric: true,
    integer: true,
    float: true,
    float32: true,
    float64: true,
    int8: true,
    int16: true,
    int32: true,
    int64: true,
    safeint: true,
    uint8: true,
    uint16: true,
    uint32: true,
    uint64: true,
    decimal: true,
    decimal128: true,
  };

  public static readonly decoratorNamesToExcludeForParts: string[] = ["minValue", "maxValue"];

  private getObjectType(
    schema: OpenAPI3Schema,
    callingScope: string[],
    isHttpPart = false,
    encoding?: Record<string, OpenAPI3Encoding>,
    context?: Context,
  ): string {
    // If we have `additionalProperties`, treat that as an 'indexer' and convert to a record.
    const recordType =
      schema.additionalProperties === true
        ? "Record<unknown>"
        : typeof schema.additionalProperties === "object"
          ? `Record<${this.generateTypeFromRefableSchema(schema.additionalProperties, callingScope)}>`
          : "";

    const requiredProps = schema.required ?? [];

    const props: string[] = [];
    if (schema.properties) {
      for (const name of Object.keys(schema.properties)) {
        const originalPropSchema = schema.properties[name];
        const isEnumType = !!context && isReferencedEnumType(originalPropSchema, context);
        const isUnionType = !!context && isReferencedUnionType(originalPropSchema, context);
        const propType = this.generateTypeFromRefableSchema(originalPropSchema, callingScope);

        const decorators = generateDecorators(
          getDecoratorsForSchema(originalPropSchema),
          isHttpPart ? SchemaToExpressionGenerator.decoratorNamesToExcludeForParts : [],
        )
          .map((d) => `${d}\n`)
          .join("");
        const isOptional = !requiredProps.includes(name) ? "?" : "";
        props.push(
          `${decorators}${printIdentifier(name)}${isOptional}: ${this.getPartType(propType, name, isHttpPart, encoding, isEnumType, isUnionType)}`,
        );
      }
    }

    let objectBody = "unknown";
    if (props.length > 0) {
      objectBody = `{${props.join("; ")}}`;
    }

    if (recordType) {
      if (props.length > 0) {
        objectBody = `{${props.join("; ")}; ...${recordType}}`;
      } else {
        objectBody = recordType;
      }
    } else {
      if (props.length === 0) {
        objectBody = "{}";
      }
    }
    return objectBody;
  }
}

export function isReferencedEnumType(
  propSchema: OpenAPI3SchemaProperty,
  context: Context,
): boolean {
  let isEnumType = false;
  try {
    isEnumType =
      ("$ref" in propSchema && context.getSchemaByRef(propSchema.$ref)?.enum) ||
      ("items" in propSchema &&
        propSchema.items &&
        "$ref" in propSchema.items &&
        context.getSchemaByRef(propSchema.items.$ref)?.enum)
        ? true
        : false;
  } catch {
    // ignore errors - we couldn't resolve the reference - so we assume it's not an enum
  }
  return isEnumType;
}

export function isReferencedUnionType(
  propSchema: OpenAPI3SchemaProperty,
  context: Context,
): boolean {
  let isUnionType = false;
  try {
    const resolvedSchema =
      "$ref" in propSchema ? context.getSchemaByRef(propSchema.$ref) : undefined;
    const resolvedItemsSchema =
      "items" in propSchema && propSchema.items && "$ref" in propSchema.items
        ? context.getSchemaByRef(propSchema.items.$ref)
        : undefined;
    isUnionType =
      (resolvedSchema && (resolvedSchema.oneOf?.length || resolvedSchema.anyOf?.length)) ||
      (resolvedItemsSchema &&
        (resolvedItemsSchema.oneOf?.length || resolvedItemsSchema.anyOf?.length))
        ? true
        : false;
  } catch {
    // ignore errors - we couldn't resolve the reference - so we assume it's not a union
  }
  return isUnionType;
}

export function getTypeSpecPrimitiveFromSchema(schema: OpenAPI3Schema): string | undefined {
  if (schema.type === "boolean") {
    return "boolean";
  } else if ((schema as any).type === "null") {
    return "null";
  } else if (schema.type === "integer") {
    return getIntegerType(schema);
  } else if (schema.type === "number") {
    return getNumberType(schema);
  } else if (schema.type === "string") {
    return getStringType(schema);
  }
  return;
}

function getIntegerType(schema: OpenAPI3Schema): string {
  const format = schema.format ?? "";
  switch (format) {
    case "int8":
    case "int16":
    case "int32":
    case "int64":
    case "uint8":
    case "uint16":
    case "uint32":
    case "uint64":
      return format;
    case "double-int":
      return "safeint";
    default:
      return "integer";
  }
}

function getNumberType(schema: OpenAPI3Schema): string {
  const format = schema.format ?? "";
  switch (format) {
    case "decimal":
    case "decimal128":
      return format;
    case "double":
      return "float64";
    case "float":
      return "float32";
    default:
      // Could be either 'float' or 'numeric' - add FIXME?
      return "numeric";
  }
}

function getStringType(schema: OpenAPI3Schema): string {
  const format = schema.format ?? "";
  let type = "string";
  switch (format) {
    case "binary":
    case "byte":
      type = "bytes";
      break;
    case "date":
      type = "plainDate";
      break;
    case "date-time":
      // Can be 'offsetDateTime' or 'utcDateTime' - needs FIXME or union?
      type = "utcDateTime";
      break;
    case "time":
      type = "plainTime";
      break;
    case "duration":
      type = "duration";
      break;
    case "uri":
      type = "url";
      break;
  }

  return type;
}

function getEnum(schemaEnum: (string | number | boolean)[]): string {
  return schemaEnum.map((e) => JSON.stringify(e)).join(" | ");
}
