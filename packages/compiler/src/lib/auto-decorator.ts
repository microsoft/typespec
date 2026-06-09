// Copyright (c) Microsoft Corporation
// Licensed under the MIT License.

import type { Program } from "../core/program.js";
import type { Type } from "../core/types.js";

/**
 * Get the state key for an auto decorator given its fully-qualified name.
 * Uses `dec:` prefix so the state key is based on decorator identity,
 * not declaration style — allows seamless migration from auto to extern.
 * @internal
 */
export function getAutoDecoratorStateKey(decoratorFqn: string): symbol {
  return Symbol.for(`TypeSpec.dec:${decoratorFqn}`);
}

/**
 * Check if an auto decorator has been applied to a target.
 * @param program - The current program.
 * @param decoratorFqn - The fully-qualified name of the decorator (e.g., "MyLib.myDec").
 * @param target - The type to check.
 */
export function hasAutoDecorator(program: Program, decoratorFqn: string, target: Type): boolean {
  const key = getAutoDecoratorStateKey(decoratorFqn);
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
export function getAutoDecoratorValue(
  program: Program,
  decoratorFqn: string,
  target: Type,
): Record<string, unknown> | undefined {
  const key = getAutoDecoratorStateKey(decoratorFqn);
  return program.stateMap(key).get(target) as Record<string, unknown> | undefined;
}

/**
 * Get all targets that have a specific auto decorator applied, along with their stored values.
 * @param program - The current program.
 * @param decoratorFqn - The fully-qualified name of the decorator (e.g., "MyLib.myDec").
 * @returns A map of target types to their stored values.
 */
export function getAutoDecoratorTargets(
  program: Program,
  decoratorFqn: string,
): Map<Type, unknown> {
  const key = getAutoDecoratorStateKey(decoratorFqn);
  return program.stateMap(key);
}
