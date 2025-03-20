import { Children, refkey as getRefkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, ModelProperty, Operation, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/experimental/typekit";
import { TypeExpression } from "../components/type-expression.jsx";

export function getReturnType(
  type: Operation,
  options: { skipErrorFiltering: boolean } = { skipErrorFiltering: false },
): Type {
  let returnType = type.returnType;

  if (!options.skipErrorFiltering && type.returnType.kind === "Union") {
    returnType = $.union.filter(type.returnType, (variant) => !$.type.isError(variant.type));
  }

  return returnType;
}

export interface BuildParameterDescriptorsOptions {
  params?: Record<string, Children | ts.ParameterDescriptor>;
  mode?: "prepend" | "append" | "replace";
}

export function buildParameterDescriptors(
  type: Model,
  options: BuildParameterDescriptorsOptions = {},
) {
  if (options.mode === "replace") {
    return options.params;
  }
  const operationParams: Record<string, Children | ts.ParameterDescriptor> = {};

  const modelProperties = $.model.getProperties(type);
  for (const prop of modelProperties.values()) {
    const [paramName, paramDescriptor] = buildParameterDescriptor(prop);
    operationParams[paramName] = paramDescriptor;
  }

  // Merge parameters based on location
  const allParams =
    options.mode === "append"
      ? { ...operationParams, ...options.params }
      : { ...options.params, ...operationParams };

  return allParams;
}

export function buildParameterDescriptor(
  modelProperty: ModelProperty,
): [string, ts.ParameterDescriptor] {
  const namePolicy = ts.useTSNamePolicy();
  const paramName = namePolicy.getName(modelProperty.name, "parameter");
  const isOptional = modelProperty.optional || modelProperty.defaultValue !== undefined;
  const paramDescriptor: ts.ParameterDescriptor = {
    refkey: getRefkey(modelProperty),
    optional: isOptional,
    type: TypeExpression({ type: modelProperty.type }),
  };

  return [paramName, paramDescriptor];
}
