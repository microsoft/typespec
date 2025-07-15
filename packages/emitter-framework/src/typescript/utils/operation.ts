import { refkey, type Refkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import type { Model, ModelProperty, Operation, Type } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { TypeExpression } from "../components/type-expression.jsx";
import { efRefkey } from "./refkey.js";

export function getReturnType(
  type: Operation,
  options: { skipErrorFiltering: boolean } = { skipErrorFiltering: false },
): Type {
  const { $ } = useTsp();
  let returnType = type.returnType;

  if (!options.skipErrorFiltering && type.returnType.kind === "Union") {
    returnType = $.union.filter(type.returnType, (variant) => !$.type.isError(variant.type));
  }

  return returnType;
}

export interface BuildParameterDescriptorsOptions {
  params?: ts.ParameterDescriptor[] | string[] | undefined;
  mode?: "prepend" | "append" | "replace";
  suffixRefkey?: Refkey;
}

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
