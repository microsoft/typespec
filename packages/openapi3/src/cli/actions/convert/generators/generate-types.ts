import { printIdentifier } from "@typespec/compiler";
import { OpenAPI3Schema, Refable } from "../../../../types.js";
import { getDecoratorsForSchema } from "../utils/decorators.js";
import { getScopeAndName } from "../utils/get-scope-and-name.js";
import { generateDecorators } from "./generate-decorators.js";

export function generateTypeFromSchema(schema: Refable<OpenAPI3Schema>): string {
  return getTypeFromRefableSchema(schema);
}

function getTypeFromRefableSchema(schema: Refable<OpenAPI3Schema>): string {
  const hasRef = "$ref" in schema;
  return hasRef ? getRefName(schema.$ref) : getTypeFromSchema(schema);
}

export function getTypeSpecPrimitiveFromSchema(schema: OpenAPI3Schema): string | undefined {
  if (schema.type === "boolean") {
    return "boolean";
  } else if (schema.type === "integer") {
    return getIntegerType(schema);
  } else if (schema.type === "number") {
    return getNumberType(schema);
  } else if (schema.type === "string") {
    return getStringType(schema);
  }
  return;
}

function getTypeFromSchema(schema: OpenAPI3Schema): string {
  let type = "unknown";

  if (schema.enum) {
    type = getEnum(schema.enum);
  } else if (schema.anyOf) {
    type = getAnyOfType(schema);
  } else if (schema.type === "array") {
    type = getArrayType(schema);
  } else if (schema.type === "boolean") {
    type = "boolean";
  } else if (schema.type === "integer") {
    type = getIntegerType(schema);
  } else if (schema.type === "number") {
    type = getNumberType(schema);
  } else if (schema.type === "object") {
    type = getObjectType(schema);
  } else if (schema.oneOf) {
    type = getOneOfType(schema);
  } else if (schema.type === "string") {
    type = getStringType(schema);
  }

  if (schema.nullable) {
    type += ` | null`;
  }

  if (schema.default) {
    type += ` = ${JSON.stringify(schema.default)}`;
  }

  return type;
}

export function getRefName(ref: string): string {
  const { scope, name } = getRefScopeAndName(ref);
  return [...scope, name].join(".");
}

export function getRefScopeAndName(ref: string): ReturnType<typeof getScopeAndName> {
  const parts = ref.split("/");
  const name = parts.pop() ?? "";
  const scopeAndName = getScopeAndName(name);

  return scopeAndName;
}

function getAnyOfType(schema: OpenAPI3Schema): string {
  const definitions: string[] = [];

  for (const item of schema.anyOf ?? []) {
    definitions.push(generateTypeFromSchema(item));
  }

  return definitions.join(" | ");
}

function getOneOfType(schema: OpenAPI3Schema): string {
  const definitions: string[] = [];

  for (const item of schema.oneOf ?? []) {
    definitions.push(generateTypeFromSchema(item));
  }

  return definitions.join(" | ");
}

function getObjectType(schema: OpenAPI3Schema): string {
  // If we have `additionalProperties`, treat that as an 'indexer' and convert to a record.
  const recordType =
    typeof schema.additionalProperties === "object"
      ? `Record<${getTypeFromRefableSchema(schema.additionalProperties)}>`
      : "";

  if (!schema.properties && recordType) {
    return recordType;
  }

  const requiredProps = schema.required ?? [];

  const props: string[] = [];
  if (schema.properties) {
    for (const name of Object.keys(schema.properties)) {
      const decorators = generateDecorators(getDecoratorsForSchema(schema.properties[name]))
        .map((d) => `${d}\n`)
        .join("");
      const isOptional = !requiredProps.includes(name) ? "?" : "";
      props.push(
        `${decorators}${printIdentifier(name)}${isOptional}: ${getTypeFromRefableSchema(schema.properties[name])}`
      );
    }
  }

  const propertyCount = Object.keys(props).length;
  if (recordType && !propertyCount) {
    return recordType;
  } else if (recordType && propertyCount) {
    props.push(`...${recordType}`);
  }

  return `{${props.join("; ")}}`;
}

export function getArrayType(schema: OpenAPI3Schema): string {
  const items = schema.items;
  if (!items) {
    return "unknown[]";
  }

  if ("$ref" in items) {
    return `${getRefName(items.$ref)}[]`;
  }

  // Prettier will get rid of the extra parenthesis for us
  return `(${getTypeFromSchema(items)})[]`;
}

export function getIntegerType(schema: OpenAPI3Schema): string {
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

export function getNumberType(schema: OpenAPI3Schema): string {
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

export function getStringType(schema: OpenAPI3Schema): string {
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
