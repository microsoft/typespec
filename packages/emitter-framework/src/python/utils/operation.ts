import { typingModule } from "#python/builtins.js";
import { refkey, type Children, type Refkey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Model, ModelProperty, Operation, Type } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { Atom } from "../components/atom/atom.js";
import { TypeExpression } from "../components/type-expression/type-expression.js";
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
  params?: (py.ParameterDescriptor | string)[];
  suffixRefkey?: Refkey;
  /** If true, params replaces operation parameters instead of adding to them */
  replaceParameters?: boolean;
}

/**
 * Build a parameter descriptor array from a TypeSpec Model.
 *
 * Parameter ordering (unless replaceParameters is true):
 * - Operation params without defaults: positional (e.g., URL path params)
 * - "*" marker (if any keyword-only params exist)
 * - Operation params with defaults: keyword-only (e.g., query params)
 * - Additional params: keyword-only
 */
export function buildParameterDescriptors(
  type: Model,
  options: BuildParameterDescriptorsOptions = {},
): (py.ParameterDescriptor | string)[] | undefined {
  const { $ } = useTsp();
  const suffixRefkey = options.suffixRefkey ?? refkey();
  const optionsParams: py.ParameterDescriptor[] = normalizeParameters(options.params ?? []);

  // If replaceParameters is true, ignore operation params and just return options params
  // All replacement parameters are keyword-only (following "additional parameters are keyword-only" principle)
  if (options.replaceParameters) {
    const withoutDefaults = optionsParams.filter((p) => p.default === undefined);
    const withDefaults = optionsParams.filter((p) => p.default !== undefined);

    // Always add "*" marker since all replacement params should be keyword-only
    const allParams: (py.ParameterDescriptor | string)[] =
      optionsParams.length > 0 ? ["*", ...withoutDefaults, ...withDefaults] : [];

    return allParams;
  }

  const modelProperties = $.model.getProperties(type);
  const operationParams: py.ParameterDescriptor[] = [...modelProperties.values()].map((m) =>
    buildParameterDescriptor(m, suffixRefkey),
  );

  // Split operation params: params without defaults are positional, params with defaults are keyword-only
  const opParamsWithoutDefaults = operationParams.filter((p) => p.default === undefined);
  const opParamsWithDefaults = operationParams.filter((p) => p.default !== undefined);

  // Reorder additional params: params without defaults before params with defaults
  const optionsWithoutDefaults = optionsParams.filter((p) => p.default === undefined);
  const optionsWithDefaults = optionsParams.filter((p) => p.default !== undefined);

  // Build final parameter list:
  // - Operation params without defaults: positional (e.g., URL path params)
  // - "*" marker (if there are keyword-only params)
  // - Operation params with defaults: keyword-only (e.g., query params with defaults)
  // - Additional params: keyword-only

  // If there are no operation params at all, treat additional params without defaults as positional
  const hasOperationParams = operationParams.length > 0;

  const positionalParams = hasOperationParams
    ? opParamsWithoutDefaults
    : [...opParamsWithoutDefaults, ...optionsWithoutDefaults];

  const keywordOnlyParams = hasOperationParams
    ? [...optionsWithoutDefaults, ...opParamsWithDefaults, ...optionsWithDefaults]
    : [...opParamsWithDefaults, ...optionsWithDefaults];

  // Add "*" marker if we have keyword-only params
  // This enforces that params with defaults are truly keyword-only
  const allParams: (py.ParameterDescriptor | string)[] =
    keywordOnlyParams.length > 0
      ? [...positionalParams, "*", ...keywordOnlyParams]
      : [...positionalParams];

  return allParams;
}

/**
 * Convert a TypeSpec ModelProperty into a Python ParameterDescriptor.
 */
export function buildParameterDescriptor(
  modelProperty: ModelProperty,
  suffixRefkey: Refkey,
): py.ParameterDescriptor {
  const { $ } = useTsp();
  const namePolicy = py.usePythonNamePolicy();
  const paramName = namePolicy.getName(modelProperty.name, "parameter");
  const isOptional = modelProperty.optional || modelProperty.defaultValue !== undefined;
  const doc = $.type.getDoc(modelProperty);
  let defaultValueNode: Children | undefined = undefined;
  const hasDefault =
    modelProperty.defaultValue !== undefined && modelProperty.defaultValue !== null;
  if (hasDefault) {
    defaultValueNode = Atom({ value: (modelProperty as any).defaultValue });
  } else if (isOptional) {
    // Render Python None for optional parameters without explicit default
    defaultValueNode = py.Atom({ jsValue: null }) as any;
  }
  return {
    doc,
    name: paramName,
    refkey: efRefkey(modelProperty, suffixRefkey),
    type: TypeExpression({ type: modelProperty.type }),
    ...(defaultValueNode !== undefined ? { default: defaultValueNode } : {}),
  };
}

const rawTypeMap = {
  string: "str",
  number: "float",
  boolean: "bool",
  any: typingModule["."]["Any"],
  never: typingModule["."]["Never"],
};

/**
 * Convert a parameter descriptor array to normalized parameter descriptors.
 * String parameter names are converted to basic parameter descriptors.
 */
function normalizeParameters(
  params: (py.ParameterDescriptor | string)[],
): py.ParameterDescriptor[] {
  if (!params) return [];

  return params.map((param) => {
    if (typeof param === "string") {
      // Convert string names to parameter descriptors
      return { name: param };
    }
    if (typeof (param as any).type === "string") {
      return {
        ...param,
        type: rawTypeMap[param.type as keyof typeof rawTypeMap] ?? param.type,
      } as py.ParameterDescriptor;
    }
    return param;
  });
}
