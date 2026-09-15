// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import type { SdkContext } from "@azure-tools/typespec-client-generator-core";
import type {
  DecoratedType,
  DecoratorContext,
  Model,
  Namespace,
  Operation,
  Program,
  Type,
} from "@typespec/compiler";
import { setTypeSpecNamespace } from "@typespec/compiler";
import type { DynamicModelDecorator } from "../../../generated-defs/TypeSpec.HttpClient.CSharp.js";
import type { ExternalDocs } from "../type/external-docs.js";
import type { InputExperimentalDetails } from "../type/input-operation.js";

/**
 * The fully qualified decorator name pattern for the dynamicModel decorator.
 * This is used in SDK context options to ensure the decorator is properly recognized.
 * @beta
 */
export const DYNAMIC_MODEL_DECORATOR_PATTERN = "TypeSpec\\.HttpClient\\.CSharp\\.@dynamicModel";
export const EXPERIMENTAL_DECORATOR_PATTERN = "TypeSpec\\.HttpClient\\.@experimental";
const experimentalDecoratorName = "TypeSpec.HttpClient.@experimental";
const csharpEmitterName = "@typespec/http-client-csharp";

interface ExperimentalDecoratorOptions {
  emitterScope?: string;
  diagnosticId?: string;
  dependsOn?: unknown[];
}

export function getExperimentalDetails(
  decorators: readonly { name: string; arguments: Record<string, unknown> }[],
): InputExperimentalDetails | undefined {
  const decorator = decorators.find((item) => item.name === experimentalDecoratorName);
  if (!decorator) {
    return undefined;
  }

  const options = decorator.arguments.options as ExperimentalDecoratorOptions | undefined;
  // TCGC filters a top-level `scope` argument, but @experimental carries
  // `emitterScope` inside its options object.
  if (!isEmitterScopeApplicable(options?.emitterScope)) {
    return undefined;
  }

  return {
    diagnosticId: typeof options?.diagnosticId === "string" ? options.diagnosticId : undefined,
    dependsOn: (options?.dependsOn ?? []).filter(
      (diagnosticId): diagnosticId is string => typeof diagnosticId === "string",
    ),
  };
}

function isEmitterScopeApplicable(emitterScope: string | undefined): boolean {
  if (!emitterScope) {
    return true;
  }

  const scopes = emitterScope
    .split(",")
    .map((scope) => scope.trim())
    .filter((scope) => scope.length > 0);
  const excludedScopes = scopes
    .filter((scope) => scope.startsWith("!"))
    .map((scope) => scope.slice(1));
  if (excludedScopes.length > 0) {
    return !excludedScopes.includes(csharpEmitterName);
  }

  return scopes.includes(csharpEmitterName);
}

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

// Set the namespace for the decorator
setTypeSpecNamespace("TypeSpec.HttpClient.CSharp", $dynamicModel);

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
