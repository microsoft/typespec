import type {
  OpenAPI3Header,
  OpenAPI3Response,
  OpenAPI3Schema,
  Refable,
  SupportedOpenAPISchema,
} from "../../../../types.js";
import type { TypeSpecDecorator, TypeSpecModelProperty } from "../interfaces.js";
import type { Context } from "./context.js";
import { convertHeaderName } from "./convert-header-name.js";
import { getDecoratorsForSchema } from "./decorators.js";

export type LiteralStatusCode = `${number}`;
export type WildcardStatusCode = "1XX" | "2XX" | "3XX" | "4XX" | "5XX";
export type StatusCodes = LiteralStatusCode | WildcardStatusCode | "default" | (string & {});

export function isValidLiteralStatusCode(statusCode: string): statusCode is LiteralStatusCode {
  if (statusCode === "default" || statusCode.endsWith("X")) return false;

  const literalStatusCode = parseInt(statusCode, 10);
  return isFinite(literalStatusCode) && literalStatusCode >= 100 && literalStatusCode <= 599;
}

export function convertStatusCodeToProperty(statusCode: string): TypeSpecModelProperty {
  const schema: OpenAPI3Schema = { type: "integer", format: "int32" };
  if (statusCode === "1XX") {
    schema.minimum = 100;
    schema.maximum = 199;
  } else if (statusCode === "2XX") {
    schema.minimum = 200;
    schema.maximum = 299;
  } else if (statusCode === "3XX") {
    schema.minimum = 300;
    schema.maximum = 399;
  } else if (statusCode === "4XX") {
    schema.minimum = 400;
    schema.maximum = 499;
  } else if (statusCode === "5XX") {
    schema.minimum = 500;
    schema.maximum = 599;
  } else if (isValidLiteralStatusCode(statusCode)) {
    const literalStatusCode = parseInt(statusCode, 10);
    schema.enum = [literalStatusCode];
  }
  return {
    name: "statusCode",
    schema,
    decorators: [{ name: "statusCode", args: [] }],
    isOptional: false,
  };
}

export function hasResponseExamples(content: OpenAPI3Response["content"]): boolean {
  return Object.values(content ?? {}).some((c) => "example" in c || "examples" in c);
}

/** Scalars do not necessarily default to application/json in the HTTP library. */
export function isScalarBody(
  schema: Refable<SupportedOpenAPISchema> | undefined,
  context: Context,
  seen = new Set<string>(),
): boolean {
  if (!schema) return false;
  if ("$ref" in schema) {
    if (seen.has(schema.$ref)) return false;
    seen.add(schema.$ref);
    return isScalarBody(context.getSchemaByRef(schema.$ref), context, seen);
  }
  return (
    schema.type === "string" ||
    schema.type === "number" ||
    schema.type === "integer" ||
    schema.type === "boolean" ||
    (schema.anyOf ?? schema.oneOf ?? []).some((s) => isScalarBody(s, context, new Set(seen)))
  );
}

export type ConvertHeaderToPropertyProps = {
  name: string;
  header: Refable<OpenAPI3Header>;
  context: Context;
};

export function convertHeaderToProperty(
  props: ConvertHeaderToPropertyProps,
): TypeSpecModelProperty | undefined {
  const { name, context } = props;
  const header =
    "$ref" in props.header ? context.getByRef<OpenAPI3Header>(props.header.$ref) : props.header;

  if (!header) return;

  const normalizedName = convertHeaderName(name);
  // TODO: handle style
  const headerDecorator: TypeSpecDecorator = { name: "header", args: [] };
  if (normalizedName !== name) {
    headerDecorator.args.push(name);
  }

  return {
    name: normalizedName,
    decorators: [headerDecorator, ...(header.schema ? getDecoratorsForSchema(header.schema) : [])],
    doc: props.header.description ?? header.description ?? header.schema?.description,
    isOptional: !header.required,
    schema: header.schema ?? {},
  };
}

/** Properties and media type selected for a generated component response model. */
export function getComponentResponseProperties(
  statusCode: string,
  response: OpenAPI3Response,
  context: Context,
): { properties: TypeSpecModelProperty[]; mediaType?: string } {
  const properties: TypeSpecModelProperty[] = [];
  if (statusCode !== "default") {
    properties.push(convertStatusCodeToProperty(statusCode));
  }
  for (const [name, header] of Object.entries(response.headers ?? {})) {
    const property = convertHeaderToProperty({ name, header, context });
    if (property) properties.push(property);
  }
  const contents = Object.entries(response.content ?? {});
  const preferred = contents.find(([mediaType]) => mediaType === "application/json") ?? contents[0];
  if (
    preferred &&
    (preferred[0] !== "application/json" ||
      (hasResponseExamples(response.content) && isScalarBody(preferred[1].schema, context)))
  ) {
    properties.push({
      name: "contentType",
      decorators: [{ name: "header", args: ["Content-Type"] }],
      isOptional: false,
      schema: { type: "string", enum: [preferred[0]] },
    });
  }
  if (preferred?.[1].schema) {
    properties.push({
      name: "body",
      decorators: [{ name: "body", args: [] }],
      isOptional: false,
      schema: preferred[1].schema,
    });
  }
  return { properties, mediaType: preferred?.[0] };
}
