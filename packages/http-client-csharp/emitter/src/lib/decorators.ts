// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License. See License.txt in the project root for license information.

import { SdkContext } from "@azure-tools/typespec-client-generator-core";
import { DecoratedType, Model, Operation, Type } from "@typespec/compiler";
import { ExternalDocs } from "../type/external-docs.js";
import { $lib } from "./lib.js";

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

const dynamicModelKey = Symbol("dynamicModel");
/**
 * @returns true if the model is marked with @dynamicModel decorator
 */
export function isDynamicModel(context: SdkContext, entity: Model): boolean {
  return context.program.stateMap(dynamicModelKey).get(entity) === true;
}

/**
 * Marks a model to use AdditionalProperties-based serialization in C#
 * instead of the traditional _serializedAdditionalRawData approach.
 */
export function $dynamicModel(context: SdkContext, target: Model) {
  context.program.stateMap(dynamicModelKey).set(target, true);
}

export function hasDecorator(type: DecoratedType, name: string): boolean {
  return type.decorators.find((it) => it.decorator.name === name) !== undefined;
}
