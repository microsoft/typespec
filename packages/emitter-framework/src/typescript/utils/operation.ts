import { refkey, type Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Model, ModelProperty, Operation, Type } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { TypeExpression } from "../components/type-expression.jsx";
import { efRefkey } from "./refkey.js";

/**
 * Gets an operation's return type for application code, removing error variants from unions
 * by default. Non-union return types, including standalone `@error` models, are unchanged.
 * Requires a TypeSpec render context.
 */
export function getReturnType(
  type: Operation,
  options: {
    /** Keep error variants in a union instead of filtering them out; defaults to false. */
    skipErrorFiltering: boolean;
  } = { skipErrorFiltering: false },
): Type {
  const { $ } = useTsp();
  let returnType = type.returnType;

  if (!options.skipErrorFiltering && type.returnType.kind === "Union") {
    returnType = $.union.filter(type.returnType, (variant) => !$.type.isError(variant.type));
  }

  return returnType;
}

/** Controls explicit/generated parameter ordering and reference identities for a signature. */
export interface BuildParameterDescriptorsOptions {
  /** Extra parameters; strings are normalized to descriptors containing only a name. */
  params?: ts.ParameterDescriptor[] | string[] | undefined;
  /** Explicit parameters precede model parameters by default; append or replace them instead. */
  mode?: "prepend" | "append" | "replace";
  /** Shared refkey suffix for this signature; a fresh suffix is created when omitted. */
  suffixRefkey?: Refkey;
}

/**
 * Builds descriptors in model property order, excluding inherited base-model properties.
 * Explicit parameters are merged according to `mode`. Default-valued properties are optional;
 * their default expressions are not emitted. Requires a TypeSpec render context.
 */
export function buildParameterDescriptors(
  type: Model,
  options: BuildParameterDescriptorsOptions = {},
): ts.ParameterDescriptor[] | undefined {
  const { $ } = useTsp();
  const suffixRefkey = options.suffixRefkey ?? refkey();
  const optionsParams = normalizeParameters(options.params);

  if (options.mode === "replace") {
    return optionsParams;
  }

  const modelProperties = $.model.getProperties(type);
  const operationParams = [...modelProperties.values()].map((m) =>
    buildParameterDescriptor(m, suffixRefkey),
  );

  // Merge parameters based on location
  const allParams =
    options.mode === "append"
      ? operationParams.concat(optionsParams)
      : optionsParams.concat(operationParams);

  return allParams;
}

/**
 * Converts one property to a parameter descriptor using the active TypeScript naming policy.
 * Preserves source documentation and makes optional or default-valued properties optional.
 * The suffix distinguishes references to this parameter from other uses of the same property.
 */
export function buildParameterDescriptor(
  modelProperty: ModelProperty,
  suffixRefkey: Refkey,
): ts.ParameterDescriptor {
  const { $ } = useTsp();
  const namePolicy = ts.useTSNamePolicy();
  const paramName = namePolicy.getName(modelProperty.name, "parameter");
  const isOptional = modelProperty.optional || modelProperty.defaultValue !== undefined;
  const doc = $.type.getDoc(modelProperty);
  return {
    doc,
    name: paramName,
    refkey: efRefkey(modelProperty, suffixRefkey),
    optional: isOptional,
    type: TypeExpression({ type: modelProperty.type }),
  };
}

/**
 * Convert a parameter descriptor array, string array, or undefined to
 * a parameter descriptor array.
 */
function normalizeParameters(
  params: ts.ParameterDescriptor[] | string[] | undefined,
): ts.ParameterDescriptor[] {
  if (!params) return [];

  return params.map((param) => {
    if (typeof param === "string") {
      return { name: param };
    }
    return param;
  });
}
