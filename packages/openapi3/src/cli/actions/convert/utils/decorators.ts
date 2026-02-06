import { printIdentifier } from "@typespec/compiler";
import { ExtensionKey } from "@typespec/openapi";
import {
  Extensions,
  OpenAPI3Parameter,
  OpenAPI3Schema,
  OpenAPIParameter3_2,
  OpenAPISchema3_1,
  OpenAPISchema3_2,
  Refable,
} from "../../../../types.js";
import { stringLiteral } from "../generators/common.js";
import { TSValue, TypeSpecDecorator, TypeSpecDirective } from "../interfaces.js";

const validLocations = ["header", "query", "path"];
const extensionDecoratorName = "extension";

export function getExtensions(element: Extensions): TypeSpecDecorator[] {
  const decorators: TypeSpecDecorator[] = [];

  for (const key of Object.keys(element)) {
    if (isExtensionKey(key)) {
      // Handle x-ms-list extension specially
      if (key === "x-ms-list" && element[key] === true) {
        decorators.push({
          name: "list",
          args: [],
        });
      }

      decorators.push({
        name: extensionDecoratorName,
        args: [key, normalizeObjectValue(element[key])],
      });
    }
  }

  return decorators;
}

function getPagingLinkDecorators(schema: OpenAPI3Schema | OpenAPISchema3_1 | OpenAPISchema3_2) {
  const decorators: TypeSpecDecorator[] = [];

  // Map of x-ms-list-*-link extensions to their corresponding TypeSpec decorators
  const linkExtensions = {
    "x-ms-list-prev-link": "prevLink",
    "x-ms-list-next-link": "nextLink",
    "x-ms-list-first-link": "firstLink",
    "x-ms-list-last-link": "lastLink",
  } as const;

  for (const [extensionKey, decoratorName] of Object.entries(linkExtensions)) {
    const extensionValue = (schema as any)[extensionKey];
    if (extensionValue === true) {
      decorators.push({
        name: decoratorName,
        args: [],
      });
    }
  }

  return decorators;
}

function normalizeObjectValue(source: unknown): string | number | object | TSValue {
  if (source !== null && typeof source === "object") {
    const result = createTSValueFromObjectValue(source);
    if (result) {
      return result;
    }
  }
  return source as string | number;
}

function isExtensionKey(key: string): key is ExtensionKey {
  return key.startsWith("x-");
}

export function getParameterDecorators(parameter: OpenAPI3Parameter | OpenAPIParameter3_2) {
  const decorators: TypeSpecDecorator[] = [];

  decorators.push(...getExtensions(parameter));

  // Add @offset decorator if x-ms-list-offset extension is true
  const xMsListOffset = (parameter as any)["x-ms-list-offset"];
  if (xMsListOffset === true) {
    decorators.push({ name: "offset", args: [] });
  }

  if ("schema" in parameter && parameter.schema) {
    decorators.push(...getDecoratorsForSchema(parameter.schema));
  }

  // Add @pageIndex decorator if x-ms-list-page-index extension is true
  const xmsListPageIndex = (parameter as any)["x-ms-list-page-index"];
  if (xmsListPageIndex === true) {
    decorators.push({ name: "pageIndex", args: [] });
  }

  const locationDecorator = getLocationDecorator(parameter);
  if (locationDecorator) decorators.push(locationDecorator);

  return decorators;
}

function getLocationDecorator(
  parameter: OpenAPI3Parameter | OpenAPIParameter3_2,
): TypeSpecDecorator | undefined {
  if (!validLocations.includes(parameter.in)) return;

  const decorator: TypeSpecDecorator = {
    name: parameter.in,
    args: [],
  };

  let decoratorArgs: TypeSpecDecorator["args"][0] | undefined;
  switch (parameter.in) {
    case "header":
      decoratorArgs = getHeaderArgs(parameter.explode ?? false);
      break;
    case "query":
      decoratorArgs = getQueryArgs({ explode: parameter.explode ?? true, style: parameter.style });
      break;
  }

  if (decoratorArgs) {
    decorator.args.push(decoratorArgs);
  }

  return decorator;
}

function createTSValueFromObjectValue(value: object): TSValue | undefined {
  if (Object.keys(value).length || Array.isArray(value)) {
    return {
      __kind: "value",
      value: normalizeObjectValueToTSValueExpression(value),
    };
  }
  return undefined;
}
export function normalizeObjectValueToTSValueExpression(value: any): string {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    return `#{${Object.entries(value)
      .map(([key, v]) => {
        return `${printIdentifier(key, "disallow-reserved")}: ${normalizeObjectValueToTSValueExpression(v)}`;
      })
      .join(", ")}}`;
  } else if (Array.isArray(value)) {
    return `#[${value.map((v) => normalizeObjectValueToTSValueExpression(v)).join(", ")}]`;
  } else if (typeof value === "string") {
    return stringLiteral(value);
  } else return `${JSON.stringify(value)}`;
}

function getQueryArgs(parameter: { explode: boolean; style?: string }): TSValue | undefined {
  const queryOptions = getNormalizedQueryOptions(parameter);
  return createTSValueFromObjectValue(queryOptions);
}

type QueryOptions = { explode?: boolean; format?: string };

function getNormalizedQueryOptions({
  explode,
  style = "",
}: {
  explode?: boolean;
  style?: string;
}): QueryOptions {
  const queryOptions: QueryOptions = {};
  // In OpenAPI 3, default style is 'form', and explode is true when 'form' is the style
  if (typeof explode !== "boolean") {
    if (style === "form" || !style) {
      explode = true;
    } else {
      explode = false;
    }
  }

  // Format only emits additional data if set to one of the following:
  // ssv (spaceDelimited), pipes (pipeDelimited)
  if (style === "spaceDelimited") {
    queryOptions.format = "ssv";
  } else if (style === "pipeDelimited") {
    queryOptions.format = "pipes";
  }

  // In TypeSpec, default explode is "false"
  if (!explode && queryOptions.format) {
    queryOptions.explode = false;
  } else if (explode) {
    queryOptions.explode = true;
  }

  return queryOptions;
}

function getHeaderArgs(explode: boolean): TSValue | undefined {
  if (explode === true) {
    return createTSValue(`#{ explode: true }`);
  }

  return undefined;
}

export function getDecoratorsForSchema(
  schema: Refable<OpenAPI3Schema | OpenAPISchema3_1 | OpenAPISchema3_2>,
): TypeSpecDecorator[] {
  const decorators: TypeSpecDecorator[] = [];

  if ("$ref" in schema) {
    return decorators;
  }

  decorators.push(...getExtensions(schema));

  // Handle x-ms-list-*-link extensions
  decorators.push(...getPagingLinkDecorators(schema));

  // Handle OpenAPI 3.1 type arrays like ["integer", "null"]
  // Extract the non-null type to determine which decorators to apply
  const effectiveType = Array.isArray(schema.type)
    ? schema.type.find((t) => t !== "null")
    : schema.type;

  // Handle x-ms-duration extension with @encode decorator
  // Must be after effectiveType extraction to handle type arrays correctly
  const xmsDuration = (schema as any)["x-ms-duration"];
  if (xmsDuration === "seconds" || xmsDuration === "milliseconds") {
    decorators.push(...getDurationSchemaDecorators(schema, effectiveType));
  }

  // Handle unixtime format with @encode decorator
  // Check both direct format and format from anyOf/oneOf members
  let formatToUse = schema.format;
  let typeForFormat = effectiveType;

  // If format is not directly on the schema, check anyOf/oneOf members for unixtime format
  if (!formatToUse) {
    const unionMembers = schema.anyOf || schema.oneOf;
    if (unionMembers) {
      for (const member of unionMembers) {
        if ("$ref" in member) continue;
        // Check if this is a non-null member with unixtime format
        if (member.format === "unixtime" && member.type !== "null") {
          formatToUse = member.format;
          // Extract effective type from member (handle type arrays)
          const memberType = Array.isArray(member.type)
            ? member.type.find((t) => t !== "null")
            : member.type;
          // Only use if we found a valid type
          if (memberType) {
            typeForFormat = memberType;
          }
          break;
        }
      }
    }
  }

  if (formatToUse === "unixtime") {
    decorators.push(...getUnixtimeSchemaDecorators(typeForFormat));
  }

  switch (effectiveType) {
    case "array":
      decorators.push(...getArraySchemaDecorators(schema));
      break;
    case "integer":
    case "number":
      decorators.push(...getNumberSchemaDecorators(schema));
      break;
    case "string":
      decorators.push(...getStringSchemaDecorators(schema));
      break;
    default:
      break;
  }

  if (schema.title) {
    decorators.push({ name: "summary", args: [schema.title] });
  }

  if (schema.discriminator) {
    if (schema.oneOf || schema.anyOf) {
      decorators.push({
        name: "discriminated",
        args: [
          createTSValue(
            `#{ envelope: "none", discriminatorPropertyName: ${JSON.stringify(schema.discriminator.propertyName)} }`,
          ),
        ],
      });
    } else {
      decorators.push({ name: "discriminator", args: [schema.discriminator.propertyName] });
    }
  }

  if (schema.oneOf) {
    decorators.push(...getOneOfSchemaDecorators(schema));
  }

  return decorators;
}

export function getDirectivesForSchema(
  schema: Refable<OpenAPI3Schema | OpenAPISchema3_1 | OpenAPISchema3_2>,
): TypeSpecDirective[] {
  const directives: TypeSpecDirective[] = [];

  if ("$ref" in schema) {
    return directives;
  }

  if (schema.deprecated) {
    directives.push({ name: "deprecated", message: "deprecated" });
  }

  return directives;
}

function createTSValue(value: string): TSValue {
  return { __kind: "value", value };
}

function getOneOfSchemaDecorators(schema: OpenAPI3Schema | OpenAPISchema3_1): TypeSpecDecorator[] {
  return [{ name: "oneOf", args: [] }];
}

function getArraySchemaDecorators(schema: OpenAPI3Schema | OpenAPISchema3_1) {
  const decorators: TypeSpecDecorator[] = [];

  if (typeof schema.minItems === "number") {
    decorators.push({ name: "minItems", args: [schema.minItems] });
  }

  if (typeof schema.maxItems === "number") {
    decorators.push({ name: "maxItems", args: [schema.maxItems] });
  }

  return decorators;
}

function getNumberSchemaDecorators(schema: OpenAPI3Schema | OpenAPISchema3_1) {
  const decorators: TypeSpecDecorator[] = [];

  if (typeof schema.minimum === "number") {
    if (schema.exclusiveMinimum) {
      decorators.push({ name: "minValueExclusive", args: [schema.minimum] });
    } else {
      decorators.push({ name: "minValue", args: [schema.minimum] });
    }
  }

  if (typeof schema.maximum === "number") {
    if (schema.exclusiveMaximum) {
      decorators.push({ name: "maxValueExclusive", args: [schema.maximum] });
    } else {
      decorators.push({ name: "maxValue", args: [schema.maximum] });
    }
  }

  return decorators;
}

function getUnixtimeSchemaDecorators(effectiveType: string | undefined) {
  const decorators: TypeSpecDecorator[] = [];

  // Only add @encode decorator for integer types
  // unixTimestamp encoding on utcDateTime must be serialized as integer
  if (effectiveType === "integer") {
    decorators.push({
      name: "encode",
      args: [createTSValue("DateTimeKnownEncoding.unixTimestamp"), createTSValue("integer")],
    });
  }

  return decorators;
}

function getDurationSchemaDecorators(
  schema: OpenAPI3Schema | OpenAPISchema3_1,
  effectiveType: string | undefined,
) {
  const decorators: TypeSpecDecorator[] = [];

  // Get the x-ms-duration value (seconds or milliseconds)
  const xmsDuration = (schema as any)["x-ms-duration"];
  if (!xmsDuration || (xmsDuration !== "seconds" && xmsDuration !== "milliseconds")) {
    return decorators;
  }

  // Determine the encoding type based on the schema's format and type
  let encodingType = "float32"; // default
  const format = schema.format ?? "";

  if (effectiveType === "integer") {
    // For integer types, use the specific format or default to integer
    switch (format) {
      case "int8":
      case "int16":
      case "int32":
      case "int64":
      case "uint8":
      case "uint16":
      case "uint32":
      case "uint64":
        encodingType = format;
        break;
      default:
        encodingType = "integer";
    }
  } else if (effectiveType === "number") {
    // For number types, use the specific format or default to float32
    switch (format) {
      case "int8":
      case "int16":
      case "int32":
      case "int64":
      case "uint8":
      case "uint16":
      case "uint32":
      case "uint64":
        // Number type can have integer formats (e.g., type: number, format: int64)
        encodingType = format;
        break;
      case "decimal":
      case "decimal128":
        encodingType = format;
        break;
      case "double":
        encodingType = "float64";
        break;
      case "float":
        encodingType = "float32";
        break;
      default:
        encodingType = "float32";
    }
  }

  decorators.push({
    name: "encode",
    args: [createTSValue(`"${xmsDuration}"`), createTSValue(encodingType)],
  });

  return decorators;
}

const knownStringFormats = new Set([
  "binary",
  "byte",
  "date",
  "date-time",
  "time",
  "duration",
  "uri",
]);

function getStringSchemaDecorators(schema: OpenAPI3Schema | OpenAPISchema3_1) {
  const decorators: TypeSpecDecorator[] = [];

  if (typeof schema.minLength === "number") {
    decorators.push({ name: "minLength", args: [schema.minLength] });
  }

  if (typeof schema.maxLength === "number") {
    decorators.push({ name: "maxLength", args: [schema.maxLength] });
  }

  if (typeof schema.pattern === "string") {
    decorators.push({ name: "pattern", args: [escapeRegex(schema.pattern)] });
  }

  if (typeof schema.format === "string" && !knownStringFormats.has(schema.format)) {
    decorators.push({ name: "format", args: [schema.format] });
  }

  // Handle contentEncoding: base64 for OpenAPI 3.1+ (indicates binary data encoded as base64 string)
  if ("contentEncoding" in schema && schema.contentEncoding === "base64") {
    decorators.push({
      name: "encode",
      args: [createTSValue(`"base64"`), createTSValue("string")],
    });
  }

  return decorators;
}

function escapeRegex(str: string) {
  return str.replace(/\\/g, "\\\\");
}
