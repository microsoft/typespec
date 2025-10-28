import { typingModule } from "#python/builtins.js";
import { refkey, type Children, type Refkey } from "@alloy-js/core";
import * as py from "@alloy-js/python";
import type { Model, ModelProperty } from "@typespec/compiler";
import { useTsp } from "../../core/index.js";
import { Atom } from "../components/atom/atom.jsx";
import { TypeExpression } from "../components/type-expression/type-expression.jsx";
import { efRefkey } from "./refkey.js";

export interface BuildParameterDescriptorsOptions {
  params?: (py.ParameterDescriptor | string)[];
  mode?: "prepend" | "append" | "replace";
  suffixRefkey?: Refkey;
}

/**
 * Build a parameter descriptor array from a TypeSpec Model.
 */
export function buildParameterDescriptors(
  type: Model,
  options: BuildParameterDescriptorsOptions = {},
): py.ParameterDescriptor[] | undefined {
  const { $ } = useTsp();
  const suffixRefkey = options.suffixRefkey ?? refkey();
  const optionsParams = normalizeParameters(options.params ?? []);

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
 * Convert a parameter descriptor array, string array, or undefined to
 * a parameter descriptor array.
 */
function normalizeParameters(
  params: (py.ParameterDescriptor | string)[],
): py.ParameterDescriptor[] {
  if (!params) return [];

  return params.map((param) => {
    if (typeof param === "string") {
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
