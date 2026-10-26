import { code, type Children } from "@alloy-js/core";
import * as py from "@alloy-js/python";

/** Pydantic validation phases: before/after built-in validation, a replacement, or a wrapping callback. */
export type PydanticValidationMode = "before" | "after" | "plain" | "wrap";

/** Optional keywords emitted by {@link fieldValidatorDecorator}; absent values are not emitted. */
export interface PydanticFieldValidatorOptions {
  /** Validation phase passed as `mode`; omission leaves Pydantic's default in effect. */
  mode?: PydanticValidationMode;
  /** Value for `check_fields`, which controls whether the named fields must exist on the model. */
  checkFields?: boolean;
}

/** Keywords for a model-wide validator; plain replacement validation is not available here. */
export interface PydanticModelValidatorOptions {
  /** Validation phase emitted as `mode`; no mode keyword is generated when omitted. */
  mode?: Exclude<PydanticValidationMode, "plain">;
}

/** Optional keywords for a field serializer decorator; omitted keywords are left to Pydantic. */
export interface PydanticFieldSerializerOptions {
  /** Plain replacement serialization or wrapping the normal serializer. */
  mode?: "plain" | "wrap";
  /** Raw Python type expression emitted as `return_type`, without string quoting. */
  returnType?: string;
  /** Restricts when the serializer runs, such as only for JSON or only for non-None values. */
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
