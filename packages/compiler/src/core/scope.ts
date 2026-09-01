// Copyright (c) Microsoft Corporation
// Licensed under the MIT License.

import type { Program } from "./program.js";
import type { Type } from "./types.js";

/**
 * The scope dimensions a `when` clause can filter on.
 *
 * Deliberately a closed set. Dimensions are unordered and independent; a scope matches a
 * condition when the condition's dimension value equals the scope's value for that dimension.
 */
export interface Scope {
  /** Fully qualified emitter package name, e.g. `@typespec/http-client-csharp`. */
  readonly emitter?: string;
  /** Target language, e.g. `csharp`. */
  readonly language?: string;
  /** Kind of artifact being produced, e.g. `client` or `server`. */
  readonly target?: string;
}

/** Names of the built-in `when` filters, in declaration order. */
export const whenFilterNames = ["emitter", "language", "target"] as const;

export type WhenFilterName = (typeof whenFilterNames)[number];

const whenFilterNameSet = new Set<string>(whenFilterNames);

export function isWhenFilterName(name: string): name is WhenFilterName {
  return whenFilterNameSet.has(name);
}

/**
 * A single resolved condition: one dimension constrained to one value.
 * @internal
 */
export interface ScopeCondition {
  readonly dimension: WhenFilterName;
  readonly value: string;
}

/**
 * A resolved `when` clause. The conditions are alternatives — the clause matches a scope
 * if *any* condition matches (the `|` in the source is a disjunction).
 * @internal
 */
export interface ScopeConditionSet {
  readonly conditions: readonly ScopeCondition[];
}

/**
 * One conditioned value stored for an auto decorator.
 * @internal
 */
export interface ScopedDecoratorEntry {
  /** The `{ paramName: value }` record the decorator would have stored unconditionally. */
  readonly value: Record<string, unknown>;
  /** `undefined` for an unscoped application, which acts as the default. */
  readonly scope: ScopeConditionSet | undefined;
}

/**
 * State key for the conditioned entries of an auto decorator.
 *
 * Deliberately a *separate* key from the unscoped auto decorator state key: the unscoped state map
 * keeps its existing `Record<paramName, value>` shape so that `getAutoDecoratorValue` retains
 * its contract and the `auto` <-> `extern` migration story is unaffected.
 * @internal
 */
export function getScopedDecoratorStateKey(decoratorFqn: string): symbol {
  return Symbol.for(`dec-scoped:${decoratorFqn}`);
}

/** Does `condition` hold for `scope`? */
function matchesCondition(scope: Scope, condition: ScopeCondition): boolean {
  return scope[condition.dimension] === condition.value;
}

/** Does any alternative in `set` hold for `scope`? */
function matchesScope(scope: Scope, set: ScopeConditionSet): boolean {
  return set.conditions.some((c) => matchesCondition(scope, c));
}

/**
 * Record a conditioned auto decorator application.
 * @internal
 */
export function addScopedDecoratorEntry(
  program: Program,
  decoratorFqn: string,
  target: Type,
  entry: ScopedDecoratorEntry,
): void {
  const stateMap = program.stateMap(getScopedDecoratorStateKey(decoratorFqn));
  const existing = stateMap.get(target) as ScopedDecoratorEntry[] | undefined;
  if (existing === undefined) {
    stateMap.set(target, [entry]);
  } else {
    existing.push(entry);
  }
}

/**
 * Get every conditioned entry recorded for an auto decorator on a target, in source order.
 * @internal
 */
export function getScopedDecoratorEntries(
  program: Program,
  decoratorFqn: string,
  target: Type,
): readonly ScopedDecoratorEntry[] | undefined {
  return program.stateMap(getScopedDecoratorStateKey(decoratorFqn)).get(target) as
    ScopedDecoratorEntry[] | undefined;
}

/**
 * Resolve the value of an auto decorator for a given scope.
 *
 * An unscoped application is the default; a scoped application whose condition matches
 * overrides it. When several scoped applications match, the last one in source order wins,
 * mirroring the last-write-wins behaviour of repeated unscoped applications.
 * @internal
 */
export function resolveScopedDecoratorValue(
  entries: readonly ScopedDecoratorEntry[],
  scope: Scope | undefined,
): Record<string, unknown> | undefined {
  let result: Record<string, unknown> | undefined;
  for (const entry of entries) {
    if (entry.scope === undefined) {
      // Unscoped default: only fills in if nothing scoped has matched yet.
      result ??= entry.value;
    } else if (scope !== undefined && matchesScope(scope, entry.scope)) {
      result = entry.value;
    }
  }
  return result;
}
