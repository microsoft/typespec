import { code, type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";

export type PydanticValidationMode = "before" | "after" | "plain" | "wrap";

export interface PydanticFieldValidatorOptions {
  mode?: PydanticValidationMode;
  checkFields?: boolean;
}

export interface PydanticModelValidatorOptions {
  mode?: Exclude<PydanticValidationMode, "plain">;
}

export interface PydanticFieldSerializerOptions {
  mode?: "plain" | "wrap";
  returnType?: string;
  whenUsed?: "always" | "unless-none" | "json" | "json-unless-none";
}

/**
 * Build a `@field_validator(...)` decorator for method `decorators`.
 */
export function fieldValidatorDecorator(
  fields: string | string[],
  options: PydanticFieldValidatorOptions = {},
): Children {
  const values = Array.isArray(fields) ? fields : [fields];
  const args = values.map((x) => JSON.stringify(x));
  if (options.mode !== undefined) args.push(`mode=${JSON.stringify(options.mode)}`);
  if (options.checkFields !== undefined) args.push(`check_fields=${options.checkFields}`);

  return code`@${py.pydanticModule["."].field_validator}(${args.join(", ")})`;
}

/**
 * Build a `@model_validator(...)` decorator for method `decorators`.
 */
export function modelValidatorDecorator(options: PydanticModelValidatorOptions = {}): Children {
  const args: string[] = [];
  if (options.mode !== undefined) args.push(`mode=${JSON.stringify(options.mode)}`);
  return code`@${py.pydanticModule["."].model_validator}(${args.join(", ")})`;
}

/**
 * Build a `@field_serializer(...)` decorator for method `decorators`.
 */
export function fieldSerializerDecorator(
  fields: string | string[],
  options: PydanticFieldSerializerOptions = {},
): Children {
  const values = Array.isArray(fields) ? fields : [fields];
  const args = values.map((x) => JSON.stringify(x));
  if (options.mode !== undefined) args.push(`mode=${JSON.stringify(options.mode)}`);
  if (options.returnType !== undefined) args.push(`return_type=${options.returnType}`);
  if (options.whenUsed !== undefined) args.push(`when_used=${JSON.stringify(options.whenUsed)}`);

  return code`@${py.pydanticModule["."].field_serializer}(${args.join(", ")})`;
}

/**
 * Build a `@computed_field` decorator for method `decorators`.
 */
export function computedFieldDecorator(): Children {
  return code`@${py.pydanticModule["."].computed_field}`;
}
