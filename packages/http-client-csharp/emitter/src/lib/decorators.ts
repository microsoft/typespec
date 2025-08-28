// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { SdkContext } from "@azure-tools/typespec-client-generator-core";
import {
  DecoratedType,
  DecoratorContext,
  Model,
  Namespace,
  Operation,
  Program,
  Type,
} from "@typespec/compiler";
import type { DynamicModelDecorator } from "../../../generated-defs/TypeSpec.HttpClient.CSharp.js";
import { ExternalDocs } from "../type/external-docs.js";

const externalDocsKey = Symbol("externalDocs");
export function getExternalDocs(context: SdkContext, entity: Type): ExternalDocs | undefined {
  return context.program.stateMap(externalDocsKey).get(entity);
}

const operationIdsKey = Symbol("operationIds");
/**
 * @returns operationId set via the @operationId decorator or `undefined`
 */
export function getOperationId(context: SdkContext, entity: Operation): string | undefined {
  return context.program.stateMap(operationIdsKey).get(entity);
}

export function hasDecorator(type: DecoratedType, name: string): boolean {
  return type.decorators.find((it) => it.decorator.name === name) !== undefined;
}

const dynamicModelKey = Symbol("dynamicModel");

/**
 * Marks a model or namespace as dynamic, indicating it should generate dynamic model code.
 * Can be applied to Model or Namespace types.
 * @param context - The decorator context
 * @param target - The model or namespace to mark as dynamic
 * @beta
 */
export const $dynamicModel: DynamicModelDecorator = (
  context: DecoratorContext,
  target: Model | Namespace,
): void => {
  context.program.stateSet(dynamicModelKey).add(target);
};

/**
 * Check if the given model or namespace is marked as dynamic.
 * @param program - The TypeSpec program
 * @param target - The model or namespace to check
 * @returns true if the target is marked as dynamic, false otherwise
 * @beta
 */
export function isDynamicModel(program: Program, target: Model | Namespace): boolean {
  return program.stateSet(dynamicModelKey).has(target);
}
