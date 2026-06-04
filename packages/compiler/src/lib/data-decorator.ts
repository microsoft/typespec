// Copyright (c) Microsoft Corporation
// Licensed under the MIT License.

import type { Program } from "../core/program.js";
import type { Type } from "../core/types.js";

/**
 * Get the state key for a data decorator given its fully-qualified name.
 * @internal
 */
export function getDataDecoratorStateKey(decoratorFqn: string): symbol {
  return Symbol.for(`data-dec:${decoratorFqn}`);
}

/**
 * Check if a data decorator has been applied to a target.
 * @param program - The current program.
 * @param decoratorFqn - The fully-qualified name of the decorator (e.g., "MyLib.myDec").
 * @param target - The type to check.
 */
export function hasDataDecorator(program: Program, decoratorFqn: string, target: Type): boolean {
  const key = getDataDecoratorStateKey(decoratorFqn);
  return program.stateMap(key).has(target);
}

/**
 * Get the stored value for an auto decorator applied to a target.
 * Always returns a record of `{ paramName: value }` (empty record `{}` for no-arg decorators).
 * @param program - The current program.
 * @param decoratorFqn - The fully-qualified name of the decorator (e.g., "MyLib.myDec").
 * @param target - The type to get the value for.
 * @returns The stored record, or `undefined` if the decorator was not applied.
 */
export function getDataDecoratorValue(
  program: Program,
  decoratorFqn: string,
  target: Type,
): Record<string, unknown> | undefined {
  const key = getDataDecoratorStateKey(decoratorFqn);
  return program.stateMap(key).get(target) as Record<string, unknown> | undefined;
}

/**
 * Get all targets that have a specific data decorator applied, along with their stored values.
 * @param program - The current program.
 * @param decoratorFqn - The fully-qualified name of the decorator (e.g., "MyLib.myDec").
 * @returns A map of target types to their stored values.
 */
export function getDataDecoratorTargets(
  program: Program,
  decoratorFqn: string,
): Map<Type, unknown> {
  const key = getDataDecoratorStateKey(decoratorFqn);
  return program.stateMap(key);
}
