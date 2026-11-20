// Copyright (c) Microsoft Corporation
// Licensed under the MIT License.

import { isCompilerFeatureEnabled } from "./features.js";
import { createDiagnostic } from "./messages.js";
import type { Program } from "./program.js";
import { SyntaxKind, type EnumMember, type Node, type WhenClauseNode } from "./types.js";

/**
 * One literal of a `when` clause: an enum member, or an open-ended range of an ordered axis.
 * @internal
 */
export interface ScopeCondition {
  readonly member: EnumMember;
  readonly relation?: "since" | "before";
}

/**
 * A resolved `when` clause in disjunctive normal form. `[[]]` is the always-true condition
 * used for unconditioned applications.
 * @internal
 */
export interface ScopeConditionSet {
  readonly groups: readonly (readonly ScopeCondition[])[];
}

export const scopeParentKey = Symbol.for("TypeSpec.Scopes.parent");

const alwaysTrue: ScopeConditionSet = { groups: [[]] };
const conditionCache = new WeakMap<Program, Map<WhenClauseNode, ScopeConditionSet | null>>();
const selectionCache = new WeakMap<Program, readonly EnumMember[]>();

/**
 * Resolve a `when` clause. Diagnostics are reported once per program; an invalid or disabled
 * clause resolves to `undefined` and is treated as never active.
 * @internal
 */
export function getWhenCondition(
  program: Program,
  when: WhenClauseNode,
): ScopeConditionSet | undefined {
  let cache = conditionCache.get(program);
  if (!cache) {
    cache = new Map();
    conditionCache.set(program, cache);
  }
  if (!cache.has(when)) {
    cache.set(when, null);
    cache.set(when, resolveWhenClause(program, when) ?? null);
  }
  return cache.get(when) ?? undefined;
}

function resolveWhenClause(program: Program, when: WhenClauseNode): ScopeConditionSet | undefined {
  if (!isCompilerFeatureEnabled(program, "scoped-decorators", when)) {
    program.reportDiagnostic(createDiagnostic({ code: "scoped-decorator-disabled", target: when }));
    return undefined;
  }
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
          createDiagnostic({ code: "invalid-scope-condition", target: condition }),
        );
        return undefined;
      }
      conditions.push({ member });
      continue;
    }
    const name = condition.target.kind === SyntaxKind.Identifier ? condition.target.sv : "";
    if (name !== "since" && name !== "before") {
      program.reportDiagnostic(
        createDiagnostic({
          code: "unknown-when-filter",
          format: { name, expected: "enum member, since, before" },
          target: condition.target,
        }),
      );
      return undefined;
    }
    const member =
      condition.arguments.length === 1 ? resolveMember(condition.arguments[0]) : undefined;
    if (member?.kind !== "EnumMember") {
      program.reportDiagnostic(
        createDiagnostic({ code: "invalid-scope-condition", target: condition }),
      );
      return undefined;
    }
    conditions.push({ member, relation: name });
  }
  const groups: ScopeCondition[][] = [[]];
  for (let i = 0; i < conditions.length; i++) {
    if (i > 0 && (when.operators?.[i - 1] ?? "|") === "|") groups.push([]);
    groups[groups.length - 1].push(conditions[i]);
  }
  return { groups };
}

/**
 * The enum members selecting the view this program checks. Empty for the default view.
 * @internal
 */
export function getScopeSelection(program: Program): readonly EnumMember[] {
  let selection = selectionCache.get(program);
  if (!selection) {
    selection = (program.compilerOptions.scopeSelection ?? []).flatMap((reference) => {
      const [type] = program.resolveTypeReference(reference);
      return type?.kind === "EnumMember" ? [type] : [];
    });
    selectionCache.set(program, selection);
  }
  return selection;
}

/** Direct parents declared with `@Scopes.parent`. */
export function getScopeParents(program: Program, member: EnumMember): readonly EnumMember[] {
  return (program.stateMap(scopeParentKey).get(member) as EnumMember[] | undefined) ?? [];
}

/** The member and every transitive parent. */
export function getScopeAncestors(program: Program, member: EnumMember): Set<EnumMember> {
  const result = new Set<EnumMember>();
  const visit = (current: EnumMember) => {
    if (result.has(current)) return;
    result.add(current);
    for (const parent of getScopeParents(program, current)) visit(parent);
  };
  visit(member);
  return result;
}

function indexOf(member: EnumMember): number {
  return [...member.enum.members.values()].indexOf(member);
}

function matchesCondition(
  program: Program,
  selection: readonly EnumMember[],
  condition: ScopeCondition,
): boolean {
  if (condition.relation) {
    const selected = selection.find((x) => x.enum === condition.member.enum);
    if (selected === undefined) return false;
    return condition.relation === "since"
      ? indexOf(selected) >= indexOf(condition.member)
      : indexOf(selected) < indexOf(condition.member);
  }
  return selection.some((selected) => getScopeAncestors(program, selected).has(condition.member));
}

/** @internal */
export function matchesScope(
  program: Program,
  selection: readonly EnumMember[],
  set: ScopeConditionSet,
): boolean {
  return set.groups.some((group) =>
    group.every((condition) => matchesCondition(program, selection, condition)),
  );
}

/**
 * Whether a `when` clause holds in the view this program checks. Nodes without a clause are
 * always active; invalid clauses never are.
 * @internal
 */
export function isWhenActive(program: Program, when: WhenClauseNode | undefined): boolean {
  if (when === undefined) return true;
  const condition = getWhenCondition(program, when);
  return condition !== undefined && matchesScope(program, getScopeSelection(program), condition);
}

/** Interval of member indexes on an ordered axis; versions are open-ended. */
function interval(condition: ScopeCondition): [number, number] {
  const index = indexOf(condition.member);
  switch (condition.relation) {
    case "since":
      return [index, Infinity];
    case "before":
      return [0, index];
    default:
      return [index, index + 1];
  }
}

function literalImplies(program: Program, a: ScopeCondition, b: ScopeCondition): boolean {
  if (!a.relation && !b.relation) return getScopeAncestors(program, a.member).has(b.member);
  if (a.member.enum !== b.member.enum) return false;
  const [aStart, aEnd] = interval(a);
  const [bStart, bEnd] = interval(b);
  return aStart >= bStart && aEnd <= bEnd;
}

/**
 * Sound, syntactic implication between conditions. It depends only on the conditions, the
 * declared hierarchy and member order, never on which views currently exist.
 * @internal
 */
export function conditionImplies(
  program: Program,
  a: ScopeConditionSet,
  b: ScopeConditionSet,
): boolean {
  return a.groups.every((left) =>
    b.groups.some((right) =>
      right.every((literal) =>
        left.some((candidate) => literalImplies(program, candidate, literal)),
      ),
    ),
  );
}

/**
 * Choose among active applications of the same decorator: the unique most specific condition
 * wins and an unconditioned application acts as the always-true default. Returns `undefined`
 * as `winner` when the choice is ambiguous.
 * @internal
 */
export function selectMostSpecific<T>(
  program: Program,
  entries: readonly { readonly item: T; readonly condition?: ScopeConditionSet }[],
): { readonly selected: readonly T[]; readonly ambiguous: boolean } {
  if (entries.every((entry) => entry.condition === undefined)) {
    return { selected: entries.map((entry) => entry.item), ambiguous: false };
  }
  const condition = (entry: (typeof entries)[number]) => entry.condition ?? alwaysTrue;
  const winners = entries.filter((winner) =>
    entries.every(
      (other) =>
        other === winner ||
        (conditionImplies(program, condition(winner), condition(other)) &&
          !conditionImplies(program, condition(other), condition(winner))),
    ),
  );
  if (winners.length === 1) return { selected: [winners[0].item], ambiguous: false };
  const last = [...entries].reverse().find((entry) => entry.condition !== undefined)!;
  return { selected: [last.item], ambiguous: true };
}
