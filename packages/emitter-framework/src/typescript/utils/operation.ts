import { Children, refkey as getRefkey } from "@alloy-js/core";
import * as ts from "@alloy-js/typescript";
import { Model, Operation, Type } from "@typespec/compiler";
import { $ } from "@typespec/compiler/typekit";
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
  location?: "start" | "end";
}

export function buildParameterDescriptors(
  type: Model,
  options: BuildParameterDescriptorsOptions = {},
) {
  const namePolicy = ts.useTSNamePolicy();

  const operationParams: Record<string, Children | ts.ParameterDescriptor> = {};

  for (const [key, prop] of type.properties) {
    const paramName = namePolicy.getName(key, "parameter");
    const paramDescriptor: ts.ParameterDescriptor = {
      refkey: getRefkey(prop),
      optional: prop.optional,
      type: TypeExpression({ type: prop.type }),
    };
    operationParams[paramName] = paramDescriptor;
  }

  // Merge parameters based on location
  const allParams =
    options.location === "end"
      ? { ...operationParams, ...options.params }
      : { ...options.params, ...operationParams };

  return allParams;
}
