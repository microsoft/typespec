import type { OpenAPI3Header, OpenAPI3Schema, Refable } from "../../../../types.js";
import type { TypeSpecDecorator, TypeSpecModelProperty } from "../interfaces.js";
import type { Context } from "./context.js";
import { convertHeaderName } from "./convert-header-name.js";
import { getDecoratorsForSchema } from "./decorators.js";

export type StatusCodes = string | "1XX" | "2XX" | "3XX" | "4XX" | "5XX" | "default";

export function isValidLiteralStatusCode(statusCode: StatusCodes): boolean {
  if (statusCode === "default" || statusCode.endsWith("X")) return false;

  const literalStatusCode = parseInt(statusCode, 10);
  return isFinite(literalStatusCode) && literalStatusCode >= 100 && literalStatusCode <= 599;
}

export function convertStatusCodeToProperty(
  statusCode: Exclude<StatusCodes, "default">,
): TypeSpecModelProperty {
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
