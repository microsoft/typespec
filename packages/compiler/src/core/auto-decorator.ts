// Copyright (c) Microsoft Corporation
// Licensed under the MIT License.

import { Realm } from "../experimental/realm.js";
import { validateDecoratorUniqueOnNode } from "./decorator-utils.js";
import type { Program } from "./program.js";
import {
  addScopedDecoratorEntry,
  getScopedDecoratorEntries,
  resolveScopedDecoratorValue,
  type Scope,
  type ScopeConditionSet,
} from "./scope.js";
import { getFullyQualifiedSymbolName } from "./type-utils.js";
import type { DecoratorContext, DecoratorDeclarationStatementNode, Sym, Type } from "./types.js";

/**
 * Get the state key for an auto decorator given its fully-qualified name.
 * Uses `dec:` prefix so the state key is based on decorator identity,
 * not declaration style — allows seamless migration from auto to extern.
 * @internal
 */
export function getAutoDecoratorStateKey(decoratorFqn: string): symbol {
  return Symbol.for(`dec:${decoratorFqn}`);
}

/**
 * Build the `{ paramName: value }` record an auto decorator stores from its arguments.
 * @internal
 */
export function buildAutoDecoratorData(
  node: DecoratorDeclarationStatementNode,
  args: unknown[],
): Record<string, unknown> {
  const paramNames = node.parameters.map((p) => p.id.sv);
  const lastParamIsRest =
    node.parameters.length > 0 && node.parameters[node.parameters.length - 1].rest;

  const data: Record<string, unknown> = {};
  if (lastParamIsRest) {
    for (let i = 0; i < paramNames.length - 1; i++) {
      data[paramNames[i]] = args[i];
    }
    // The rest parameter collects all remaining arguments into an array.
    data[paramNames[paramNames.length - 1]] = args.slice(paramNames.length - 1);
  } else {
    for (let i = 0; i < paramNames.length; i++) {
      data[paramNames[i]] = args[i];
    }
  }
  return data;
}

/**
 * Build the auto-generated implementation for an `auto dec` declaration.
 *
 * The returned function stores its arguments as a uniform `{ paramName: value }`
 * record in the program state map keyed by the decorator's fully-qualified name,
 * and warns (last-write-wins, like extern decorators) on duplicate application.
 * @internal
 */
export function createAutoDecoratorImplementation(
  symbol: Sym,
  node: DecoratorDeclarationStatementNode,
): (ctx: DecoratorContext, target: Type, ...args: unknown[]) => void {
  const fqn = getFullyQualifiedSymbolName(symbol);

  const impl = (context: DecoratorContext, target: Type, ...args: unknown[]) => {
    // Warn (but still store, so duplicates are last-write-wins like extern
    // decorators) if the same auto decorator is applied twice on the same node.
    if ("decorators" in target) {
      validateDecoratorUniqueOnNode(context, target, impl);
    }

    setAutoDecorator(context.program, fqn, target, buildAutoDecoratorData(node, args));
  };
  // The function name drives the `@<name>` text in the duplicate-decorator
  // diagnostic; mirror the extern `$name` convention so the helper strips it.
  Object.defineProperty(impl, "name", { value: `$${node.id.sv}` });
  return impl;
}

/**
 * Build the implementation for a *conditioned* (`when`-scoped) `auto dec` application.
 *
 * Unlike the unscoped implementation this does not warn on duplicates: several scoped
 * applications on the same target are the whole point of the feature. The value is written
 * to a separate state map so the unscoped `getAutoDecoratorValue` contract is unaffected.
 * @internal
 */
export function createScopedAutoDecoratorImplementation(
  symbol: Sym,
  node: DecoratorDeclarationStatementNode,
  scope: ScopeConditionSet,
): (ctx: DecoratorContext, target: Type, ...args: unknown[]) => void {
  const fqn = getFullyQualifiedSymbolName(symbol);
  const impl = (context: DecoratorContext, target: Type, ...args: unknown[]) => {
    addScopedDecoratorEntry(context.program, fqn, target, {
      value: buildAutoDecoratorData(node, args),
      scope,
    });
  };
  Object.defineProperty(impl, "name", { value: `$${node.id.sv}` });
  return impl;
}

/**
 * Programmatically apply an auto decorator to a target, storing its argument values.
 *
 * Mirrors what the synthesized `auto dec` implementation does when the decorator is
 * written in source, so emitters and mutators can mark synthetic types the same way
 * without reaching into the program state map directly.
 * @param program - The current program.
 * @param decoratorFqn - The fully-qualified name of the decorator (e.g., "MyLib.myDec").
 * @param target - The type to mark.
 * @param value - The stored `{ paramName: value }` record (defaults to `{}` for a no-arg decorator).
 */
export function setAutoDecorator(
  program: Program,
  decoratorFqn: string,
  target: Type,
  value: Record<string, unknown> = {},
): void {
  const key = getAutoDecoratorStateKey(decoratorFqn);
  program.stateMap(key).set(target, value);
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
 * @param scope - Optional scope used to resolve `when`-conditioned applications. A scoped
 * application whose condition matches takes precedence over the unscoped value.
 * @returns The stored record, or `undefined` if the decorator was not applied.
 */
export function getAutoDecoratorValue(
  program: Program,
  decoratorFqn: string,
  target: Type,
  scope?: Scope,
): Record<string, unknown> | undefined {
  // Realm state maps only resolve state for types the realm owns, so a clone carries none of
  // the state recorded against the type it was cloned from. Walk back to that source type.
  const resolved = Realm.sourceOf(target);

  if (scope !== undefined) {
    const entries = getScopedDecoratorEntries(program, decoratorFqn, resolved);
    if (entries !== undefined) {
      const value = resolveScopedDecoratorValue(entries, scope);
      if (value !== undefined) {
        return value;
      }
    }
  }

  const key = getAutoDecoratorStateKey(decoratorFqn);
  return program.stateMap(key).get(resolved) as Record<string, unknown> | undefined;
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
