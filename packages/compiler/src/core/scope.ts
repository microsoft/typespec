// Copyright (c) Microsoft Corporation
// Licensed under the MIT License.

import { createDiagnostic } from "./messages.js";
import type { Program } from "./program.js";
import { SyntaxKind, type EnumMember, type Node, type Type, type WhenClauseNode } from "./types.js";

/**
 * The scope dimensions a `when` clause can filter on.
 *
 * Deliberately a closed set. Dimensions are unordered and independent; a scope matches a
 * condition when the condition's dimension value equals the scope's value for that dimension.
 */
export interface Scope {
  /** Selections on declared enum axes. Omitted axes expose no conditioned metadata. */
  readonly selections?: readonly EnumMember[];
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
export type ScopeCondition =
  | {
      readonly dimension: WhenFilterName;
      readonly value: string;
    }
  | {
      readonly dimension: "enum";
      readonly value: EnumMember;
      readonly relation?: "since" | "before";
    };

/**
 * A resolved `when` clause. The conditions are alternatives — the clause matches a scope
 * if *any* condition matches (the `|` in the source is a disjunction).
 * @internal
 */
export interface ScopeConditionSet {
  readonly conditions: readonly ScopeCondition[];
  /** Disjunction of conjunctions. Legacy clauses contain singleton groups. */
  readonly groups?: readonly (readonly ScopeCondition[])[];
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
  readonly node?: Node;
}

export const scopeParentKey = Symbol.for("TypeSpec.Scopes.parent");
export const scopeUniverseKey = Symbol.for("TypeSpec.Scopes.universe");
export const scopeAlternativesKey = Symbol.for("TypeSpec.Scopes.alternatives");

/**
 * An explicit set of scope-conditioned alternatives (`when { cond => ..., else => ... }`).
 * The unscoped graph keeps every member; a view selects the most specific matching branch.
 * @experimental
 */
export interface ScopeAlternatives {
  /** The alternatives union for the type form; undefined for operation groups. */
  readonly owner?: Type;
  /** Branch types, in source order (union variants or operations). */
  readonly members: readonly Type[];
  /** Branch nodes, parallel to `members`. A branch without `when` is the `else` branch. */
  readonly branches: readonly (Node & { readonly when?: WhenClauseNode })[];
}

/** @internal */
export function registerScopeAlternatives(program: Program, group: ScopeAlternatives): void {
  const map = program.stateMap(scopeAlternativesKey);
  if (group.owner) map.set(group.owner, group);
  for (const member of group.members) map.set(member, group);
}

/**
 * Get the explicit alternatives group a type owns (alternatives union) or belongs to (branch).
 * @experimental
 */
export function getScopeAlternatives(program: Program, type: Type): ScopeAlternatives | undefined {
  return program.stateMap(scopeAlternativesKey).get(type) as ScopeAlternatives | undefined;
}

/**
 * Pick the most specific condition among those matching `scope`: the one whose finite domain
 * is a strict subset of every other matching domain. `undefined` entries are `else` branches and
 * only apply when nothing else matches. Overlaps without a single most specific winner are
 * ambiguous.
 * @internal
 */
export function selectMostSpecific(
  program: Program,
  scope: Scope,
  sets: readonly (ScopeConditionSet | undefined)[],
): { index?: number; ambiguous: boolean } {
  const matching = sets
    .map((set, index) => ({ set, index }))
    .filter((x) => x.set !== undefined && matchesScope(scope, x.set, program));
  if (matching.length === 0) {
    const fallback = sets.findIndex((x) => x === undefined);
    return { index: fallback >= 0 ? fallback : undefined, ambiguous: false };
  }
  if (matching.length === 1) return { index: matching[0].index, ambiguous: false };
  const universe = program.stateMap(scopeUniverseKey).get(program.getGlobalNamespaceType()) as
    Scope[] | undefined;
  if (!universe) return { ambiguous: true };
  const domains = matching.map(
    (x) =>
      new Set(
        universe
          .map((candidate, i) => (matchesScope(candidate, x.set!, program) ? i : -1))
          .filter((i) => i >= 0),
      ),
  );
  const winners = matching.filter((_, i) =>
    domains.every(
      (other, j) =>
        i === j || (domains[i].size < other.size && [...domains[i]].every((x) => other.has(x))),
    ),
  );
  return winners.length === 1 ? { index: winners[0].index, ambiguous: false } : { ambiguous: true };
}

export function resolveWhenClause(
  program: Program,
  when: WhenClauseNode,
): ScopeConditionSet | undefined {
  const resolveMember = (node: Node) =>
    program.checker.getTypeForNode(
      node.kind === SyntaxKind.Identifier || node.kind === SyntaxKind.MemberExpression
        ? { ...node, kind: SyntaxKind.TypeReference, target: node, arguments: [] }
        : node,
    );
  const conditions: ScopeCondition[] = [];
  for (const condition of when.conditions) {
    if (condition.kind !== SyntaxKind.CallExpression) {
      const member = resolveMember(condition);
      if (member.kind !== "EnumMember") {
        program.reportDiagnostic(
          createDiagnostic({
            code: "invalid-scope-condition",
            target: condition,
          }),
        );
        return undefined;
      }
      conditions.push({ dimension: "enum", value: member });
      continue;
    }
    const name = condition.target.kind === SyntaxKind.Identifier ? condition.target.sv : "";
    if (name === "since" || name === "before") {
      const member =
        condition.arguments.length === 1 ? resolveMember(condition.arguments[0]) : undefined;
      if (member?.kind !== "EnumMember") {
        program.reportDiagnostic(
          createDiagnostic({ code: "invalid-scope-condition", target: condition }),
        );
        return undefined;
      }
      conditions.push({ dimension: "enum", value: member, relation: name });
      continue;
    }
    if (!isWhenFilterName(name)) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "unknown-when-filter",
          format: { name, expected: `${whenFilterNames.join(", ")}, enum member, since, before` },
          target: condition.target,
        }),
      );
      return undefined;
    }
    if (
      condition.arguments.length !== 1 ||
      condition.arguments[0].kind !== SyntaxKind.StringLiteral
    ) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-when-condition",
          format: { name },
          messageId: condition.arguments.length === 1 ? "notAValue" : "default",
          target: condition,
        }),
      );
      return undefined;
    }
    conditions.push({ dimension: name, value: condition.arguments[0].value });
  }
  const groups: ScopeCondition[][] = [[]];
  for (let i = 0; i < conditions.length; i++) {
    if (i > 0 && (when.operators?.[i - 1] ?? "|") === "|") groups.push([]);
    groups[groups.length - 1].push(conditions[i]);
  }
  return { conditions, groups };
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
function matchesCondition(scope: Scope, condition: ScopeCondition, program?: Program): boolean {
  if (condition.dimension === "enum") {
    let selected = scope.selections?.find((x) => x.enum === condition.value.enum);
    if (selected === undefined) return false;
    if (condition.relation) {
      const values = [...condition.value.enum.members.values()];
      return condition.relation === "since"
        ? values.indexOf(selected) >= values.indexOf(condition.value)
        : values.indexOf(selected) < values.indexOf(condition.value);
    }
    const seen = new Set<EnumMember>();
    while (selected && !seen.has(selected)) {
      if (selected === condition.value) return true;
      seen.add(selected);
      selected = program?.stateMap(scopeParentKey).get(selected);
    }
    return false;
  }
  return scope[condition.dimension] === condition.value;
}

/** Does any alternative in `set` hold for `scope`? */
export function matchesScope(scope: Scope, set: ScopeConditionSet, program?: Program): boolean {
  return (set.groups ?? set.conditions.map((c) => [c])).some((group) =>
    group.every((c) => matchesCondition(scope, c, program)),
  );
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
 * mirroring the last-write-wins behavior of repeated unscoped applications.
 * @internal
 */
export function resolveScopedDecoratorValue(
  entries: readonly ScopedDecoratorEntry[],
  scope: Scope | undefined,
  program?: Program,
): Record<string, unknown> | undefined {
  if (
    scope?.selections &&
    program &&
    program.stateMap(scopeUniverseKey).has(program.getGlobalNamespaceType())
  ) {
    const scoped = entries.filter((entry) => entry.scope);
    const { index } = selectMostSpecific(
      program,
      scope,
      scoped.map((entry) => entry.scope),
    );
    return index === undefined ? undefined : scoped[index].value;
  }
  let result: Record<string, unknown> | undefined;
  for (const entry of entries) {
    if (entry.scope === undefined) {
      // Unscoped default: only fills in if nothing scoped has matched yet.
      result ??= entry.value;
    } else if (scope !== undefined && matchesScope(scope, entry.scope, program)) {
      result = entry.value;
    }
  }
  return result;
}
