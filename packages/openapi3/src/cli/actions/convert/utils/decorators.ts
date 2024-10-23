import { ExtensionKey } from "@typespec/openapi";
import { Extensions, OpenAPI3Parameter, OpenAPI3Schema, Refable } from "../../../../types.js";
import { TypeSpecDecorator } from "../interfaces.js";

const validLocations = ["header", "query", "path"];
const extensionDecoratorName = "extension";

export function getExtensions(element: Extensions): TypeSpecDecorator[] {
  const decorators: TypeSpecDecorator[] = [];

  for (const key of Object.keys(element)) {
    if (isExtensionKey(key)) {
      decorators.push({
        name: extensionDecoratorName,
        args: [key, element[key]],
      });
    }
  }

  return decorators;
}

function isExtensionKey(key: string): key is ExtensionKey {
  return key.startsWith("x-");
}

export function getParameterDecorators(parameter: OpenAPI3Parameter) {
  const decorators: TypeSpecDecorator[] = [];

  decorators.push(...getExtensions(parameter));
  decorators.push(...getDecoratorsForSchema(parameter.schema));

  const locationDecorator = getLocationDecorator(parameter);
  if (locationDecorator) decorators.push(locationDecorator);

  return decorators;
}

function getLocationDecorator(parameter: OpenAPI3Parameter): TypeSpecDecorator | undefined {
  if (!validLocations.includes(parameter.in)) return;

  const decorator: TypeSpecDecorator = {
    name: parameter.in,
    args: [],
  };

  let format: string | undefined;
  switch (parameter.in) {
    case "header":
      format = getHeaderFormat(parameter.style);
      break;
    case "query":
      format = getQueryFormat(parameter.explode, parameter.style);
      break;
  }

  if (format) {
    decorator.args.push({ format });
  }

  return decorator;
}

function getQueryFormat(explode?: boolean, style?: string): string | undefined {
  if (explode) {
    return "form";
  } else if (style === "form") {
    return "simple";
  } else if (style === "spaceDelimited") {
    return "ssv";
  } else if (style === "pipeDelimited") {
    return "pipes";
  }
  return;
}

function getHeaderFormat(style?: string): string | undefined {
  return style === "simple" ? "simple" : undefined;
}

export function getDecoratorsForSchema(schema: Refable<OpenAPI3Schema>): TypeSpecDecorator[] {
  const decorators: TypeSpecDecorator[] = [];

  if ("$ref" in schema) {
    return decorators;
  }

  decorators.push(...getExtensions(schema));

  switch (schema.type) {
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

  if (schema.discriminator) {
    decorators.push({ name: "discriminator", args: [schema.discriminator.propertyName] });
  }

  if (schema.oneOf) {
    decorators.push(...getOneOfSchemaDecorators(schema));
  }

  return decorators;
}

function getOneOfSchemaDecorators(schema: OpenAPI3Schema): TypeSpecDecorator[] {
  return [{ name: "oneOf", args: [] }];
}

function getArraySchemaDecorators(schema: OpenAPI3Schema) {
  const decorators: TypeSpecDecorator[] = [];

  if (typeof schema.minItems === "number") {
    decorators.push({ name: "minItems", args: [schema.minItems] });
  }

  if (typeof schema.maxItems === "number") {
    decorators.push({ name: "maxItems", args: [schema.maxItems] });
  }

  return decorators;
}

function getNumberSchemaDecorators(schema: OpenAPI3Schema) {
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

const knownStringFormats = new Set([
  "binary",
  "byte",
  "date",
  "date-time",
  "time",
  "duration",
  "uri",
]);

function getStringSchemaDecorators(schema: OpenAPI3Schema) {
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

  return decorators;
}

function escapeRegex(str: string) {
  return str.replace(/\\/g, "\\\\");
}
