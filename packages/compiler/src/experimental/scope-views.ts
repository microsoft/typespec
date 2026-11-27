import type { AbsentScopeReference } from "../core/checker.js";
import { getTypeName } from "../core/helpers/type-name-utils.js";
import { createDiagnostic } from "../core/messages.js";
import { visitChildren } from "../core/parser.js";
import type { Program } from "../core/program.js";
import {
  getScopeParents,
  getWhenCondition,
  matchesScope,
  scopeParentKey,
  type ScopeConditionSet,
} from "../core/scope.js";
import { navigateProgram } from "../core/semantic-walker.js";
import {
  SyntaxKind,
  type Diagnostic,
  type Enum,
  type EnumMember,
  type Namespace,
  type Node,
  type Type,
  type WhenClauseNode,
} from "../core/types.js";
import { getRawVisibilityStore } from "../core/visibility/core.js";
import { getLifecycleVisibilityEnum } from "../core/visibility/lifecycle.js";
import { mutateSubgraphWithNamespace, type MutatorWithNamespace } from "./mutators.js";

/**
 * Lets a library describe an axis it owns (e.g. service versions). Axes are registered by each
 * program, so view programs register their own adapters against their own types.
 */
export interface ScopeViewAxis {
  readonly enum: Enum;
  /** Restrict the selectable members, e.g. a pinned dependency version. */
  readonly members?: readonly EnumMember[];
  /** Members of other axes implied by selecting `member`, e.g. dependency versions. */
  readonly implied?: (member: EnumMember) => readonly EnumMember[];
  /** Whether `type` exists when `member` is selected. Used to scope reference errors. */
  readonly isPresent?: (member: EnumMember, type: Type) => boolean;
  /** Projection applied to the view program when displaying `member`. */
  readonly project?: (member: EnumMember) => MutatorWithNamespace;
}

/** One concrete scope selection and the program checked for it. */
export interface ScopeView {
  readonly name: string;
  /** Selected members, from the program that enumerated the views. */
  readonly selections: readonly EnumMember[];
  /** Program checked with this selection. Views with identical conditions share a program. */
  readonly program: Program;
  /** Global namespace of {@link ScopeView.program} with library projections (e.g. versioning) applied. */
  getGlobalNamespaceType(): Namespace;
}

interface ScopeViewState {
  readonly axes: ScopeViewAxis[];
  views: readonly ScopeView[];
}

/** Upper bound on enumerated selections; distinct programs are usually far fewer. */
const maxSelections = 4096;
// Shared through the global symbol registry: the playground and libraries may load separate
// copies of this module while operating on the same program.
const states: WeakMap<Program, ScopeViewState> = ((globalThis as any)[
  Symbol.for("TypeSpec.scopeViews")
] ??= new WeakMap());
const whenClauses = new WeakMap<Program, readonly WhenClauseNode[]>();

function state(program: Program): ScopeViewState {
  let result = states.get(program);
  if (!result) {
    result = { axes: [], views: [] };
    states.set(program, result);
  }
  return result;
}

export function registerScopeViewAxis(program: Program, axis: ScopeViewAxis): void {
  state(program).axes.push(axis);
}

/** Scope views of a program, available after validation. Empty without `when` clauses. */
export function getScopeViews(program: Program): readonly ScopeView[] {
  return state(program).views;
}

export function hasScopeConditions(program: Program): boolean {
  return getWhenClauses(program).length > 0;
}

function getWhenClauses(program: Program): readonly WhenClauseNode[] {
  let result = whenClauses.get(program);
  if (!result) {
    const found: WhenClauseNode[] = [];
    const visit = (node: Node): undefined => {
      if (node.kind === SyntaxKind.WhenClause) {
        found.push(node);
        return;
      }
      if ("when" in node && node.when) found.push(node.when as WhenClauseNode);
      visitChildren(node, visit);
      return;
    };
    for (const file of program.sourceFiles.values()) visit(file);
    result = [...new Set(found)];
    whenClauses.set(program, result);
  }
  return result;
}

function memberName(member: EnumMember): string {
  return getTypeName(member);
}

function viewName(selection: readonly EnumMember[]): string {
  return selection.map(memberName).join(" + ");
}

/**
 * Check every distinct scope view by compiling the program again with the view selected, so
 * that the real checker, decorators, validators and linters run on each view.
 * @internal
 */
export async function validateScopeViews(
  program: Program,
  compileView: (selection: readonly string[]) => Promise<Program>,
): Promise<void> {
  if (program.compilerOptions.scopeSelection) return;
  const clauses = getWhenClauses(program);
  if (clauses.length === 0) return;

  const conditions: { node: WhenClauseNode; condition: ScopeConditionSet }[] = [];
  const visibilityClasses = getVisibilityClasses(program);
  for (const node of clauses) {
    const condition = getWhenCondition(program, node);
    if (!condition) continue;
    const visibilityMember = condition.groups
      .flat()
      .find((literal) => visibilityClasses.has(literal.member.enum));
    if (visibilityMember) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-scope-condition",
          messageId: "visibility",
          format: { name: visibilityMember.member.enum.name },
          target: node,
        }),
      );
      continue;
    }
    conditions.push({ node, condition });
  }
  if (conditions.length === 0) return;

  const hierarchy = buildHierarchy(program, conditions);
  const selections = enumerateSelections(program, conditions, hierarchy);

  const groups = new Map<string, EnumMember[][]>();
  const reachable = new Set<number>();
  for (const selection of selections) {
    const vector = conditions.map(({ condition }, index) => {
      const value = matchesScope(program, selection, condition);
      if (value) reachable.add(index);
      return value ? "1" : "0";
    });
    const key = vector.join("");
    groups.set(key, [...(groups.get(key) ?? []), selection]);
  }
  conditions.forEach(({ node }, index) => {
    if (!reachable.has(index)) {
      program.reportDiagnostic(
        createDiagnostic({ code: "unreachable-scope-condition", target: node }),
      );
    }
  });

  const reported = new Set(program.diagnostics.map(diagnosticKey));
  const report = (diagnostic: Diagnostic, view?: string) => {
    const key = diagnosticKey(diagnostic);
    if (reported.has(key)) return;
    reported.add(key);
    program.reportDiagnostic(
      view
        ? { ...diagnostic, message: `${diagnostic.message} (in scope view: ${view})` }
        : diagnostic,
    );
  };

  reportAbsentReferences(
    program,
    program.checker.getAbsentScopeReferences(),
    report,
    [],
    "default",
  );

  const views: ScopeView[] = [];
  for (const group of groups.values()) {
    const viewProgram = await compileView(group[0].map((member) => getTypeName(member)));
    const name = viewName(group[0]);
    for (const diagnostic of viewProgram.diagnostics) report(diagnostic, name);
    reportAbsentReferences(
      viewProgram,
      viewProgram.checker.getAbsentScopeReferences(),
      report,
      group,
      undefined,
    );
    for (const selection of group) views.push(createView(viewProgram, selection));
  }
  state(program).views = views.sort((a, b) => a.name.localeCompare(b.name));
}

function diagnosticKey(diagnostic: Diagnostic): string {
  const target = diagnostic.target;
  const location =
    typeof target === "object" && target !== null && "kind" in target && "pos" in target
      ? `${(target as Node).pos}:${getFilePath(target as Node)}`
      : typeof target === "object" && target !== null && "file" in target
        ? `${(target as { pos: number }).pos}:${(target as { file: { path: string } }).file.path}`
        : "";
  return `${diagnostic.code}|${location}|${location ? "" : diagnostic.message}`;
}

function getFilePath(node: Node): string {
  let current: Node | undefined = node;
  while (current?.parent) current = current.parent;
  return current?.kind === SyntaxKind.TypeSpecScript ? current.file.path : "";
}

interface Hierarchy {
  readonly axisOf: (member: EnumMember) => Enum;
  readonly concrete: Map<Enum, EnumMember[]>;
}

function buildHierarchy(
  program: Program,
  conditions: readonly { condition: ScopeConditionSet }[],
): Hierarchy {
  const axes = new Map<EnumMember, Enum>();
  const visiting = new Set<EnumMember>();
  const axisOf = (member: EnumMember): Enum => {
    const cached = axes.get(member);
    if (cached) return cached;
    if (visiting.has(member)) {
      program.reportDiagnostic(
        createDiagnostic({ code: "invalid-scope-hierarchy", target: member }),
      );
      return member.enum;
    }
    visiting.add(member);
    const parents = getScopeParents(program, member);
    let axis = member.enum;
    if (parents.length > 0) {
      axis = axisOf(parents[0]);
      for (const parent of parents.slice(1)) {
        const other = axisOf(parent);
        if (other !== axis) {
          program.reportDiagnostic(
            createDiagnostic({
              code: "invalid-scope-hierarchy",
              messageId: "root",
              format: { member: memberName(member), first: axis.name, second: other.name },
              target: member,
            }),
          );
        }
      }
    }
    visiting.delete(member);
    axes.set(member, axis);
    return axis;
  };

  const members = new Set<EnumMember>();
  const parents = new Set<EnumMember>();
  for (const [child, childParents] of program.stateMap(scopeParentKey) as Map<
    EnumMember,
    EnumMember[]
  >) {
    members.add(child);
    childParents.forEach((parent) => parents.add(parent));
  }
  for (const { condition } of conditions) {
    for (const literal of condition.groups.flat()) members.add(literal.member);
  }
  for (const member of [...members]) {
    for (const sibling of axisOf(member).members.values()) members.add(sibling);
  }

  const concrete = new Map<Enum, EnumMember[]>();
  for (const member of members) {
    if (parents.has(member)) continue;
    const axis = axisOf(member);
    concrete.set(axis, [...(concrete.get(axis) ?? []), member]);
  }
  return { axisOf, concrete };
}

function enumerateSelections(
  program: Program,
  conditions: readonly { condition: ScopeConditionSet }[],
  hierarchy: Hierarchy,
): EnumMember[][] {
  const adapters = state(program).axes;
  const axes = new Set<Enum>();
  for (const { condition } of conditions) {
    for (const literal of condition.groups.flat()) axes.add(hierarchy.axisOf(literal.member));
  }
  const implies = (member: EnumMember) =>
    adapters.flatMap((adapter) =>
      adapter.enum === member.enum ? (adapter.implied?.(member) ?? []) : [],
    );

  // Axes implied by another axis (e.g. dependency versions) follow that axis instead of
  // multiplying the views.
  const derived = new Set<Enum>();
  for (const axis of axes) {
    for (const member of hierarchy.concrete.get(axis) ?? []) {
      for (const implied of implies(member)) if (implied.enum !== axis) derived.add(implied.enum);
    }
  }
  for (const adapter of adapters) {
    if (adapter.members && axes.has(adapter.enum))
      hierarchy.concrete.set(adapter.enum, [...adapter.members]);
  }

  let selections: EnumMember[][] = [[]];
  for (const axis of axes) {
    if (derived.has(axis)) continue;
    const members = hierarchy.concrete.get(axis) ?? [];
    selections = selections.flatMap((selection) => members.map((member) => [...selection, member]));
    if (selections.length > maxSelections) {
      selections = selections.slice(0, maxSelections);
      break;
    }
  }
  return selections.map((selection) => {
    const result = [...selection];
    for (const member of selection) {
      for (const implied of implies(member)) {
        if (!result.some((x) => x.enum === implied.enum)) result.push(implied);
      }
    }
    return result;
  });
}

function getVisibilityClasses(program: Program): Set<Enum> {
  const classes = new Set<Enum>([getLifecycleVisibilityEnum(program)]);
  navigateProgram(program, {
    modelProperty(property) {
      for (const visibilityClass of getRawVisibilityStore(program, property)?.keys() ?? []) {
        classes.add(visibilityClass);
      }
    },
  });
  return classes;
}

/**
 * Report references to declarations absent from a view, only when the referencing site itself
 * exists in that view according to the registered axes (e.g. it is not removed by versioning).
 * The default view selects no member; its sites must exist in every member of each axis.
 */
function reportAbsentReferences(
  viewProgram: Program,
  references: readonly AbsentScopeReference[],
  report: (diagnostic: Diagnostic, view?: string) => void,
  group: readonly (readonly EnumMember[])[],
  defaultName: string | undefined,
): void {
  const adapters = state(viewProgram).axes.filter((adapter) => adapter.isPresent);
  const resolve = (member: EnumMember) => {
    const [type] = viewProgram.resolveTypeReference(getTypeName(member));
    return type?.kind === "EnumMember" ? type : undefined;
  };
  for (const reference of references) {
    const site = getSiteType(viewProgram, reference.node);
    let view = defaultName;
    if (site && defaultName) {
      const present = adapters.every((adapter) =>
        [...adapter.enum.members.values()].every((member) => adapter.isPresent!(member, site)),
      );
      if (!present) continue;
    } else if (site) {
      const selection = group.find((selection) =>
        adapters.every((adapter) => {
          const member = selection.map(resolve).find((x) => x?.enum === adapter.enum);
          return member === undefined || adapter.isPresent!(member, site);
        }),
      );
      if (!selection) continue;
      view = viewName(selection);
    } else {
      view ??= viewName(group[0]);
    }
    report(
      createDiagnostic({
        code: "incompatible-scoped-reference",
        format: { target: reference.target.name, view: view! },
        target: reference.node,
      }),
    );
  }
}

function getSiteType(program: Program, node: Node): Type | undefined {
  for (let current: Node | undefined = node; current; current = current.parent) {
    switch (current.kind) {
      case SyntaxKind.ModelProperty:
      case SyntaxKind.OperationStatement:
      case SyntaxKind.ModelStatement:
      case SyntaxKind.ScalarStatement:
      case SyntaxKind.UnionVariant:
      case SyntaxKind.UnionStatement:
      case SyntaxKind.InterfaceStatement:
      case SyntaxKind.EnumMember:
        return program.checker.getTypeForNode(current);
    }
  }
  return undefined;
}

function createView(program: Program, selection: readonly EnumMember[]): ScopeView {
  let namespace: Namespace | undefined;
  return {
    name: viewName(selection),
    selections: selection,
    program,
    getGlobalNamespaceType() {
      if (namespace) return namespace;
      const mutators: MutatorWithNamespace[] = [];
      for (const adapter of state(program).axes) {
        if (!adapter.project) continue;
        const adapterEnum = getTypeName(adapter.enum);
        const selected = selection.find((member) => getTypeName(member.enum) === adapterEnum);
        const [member] = selected ? program.resolveTypeReference(getTypeName(selected)) : [];
        if (member?.kind !== "EnumMember" || member.enum !== adapter.enum) continue;
        mutators.push(adapter.project(member));
      }
      // Projections run in one pass: versioning state is keyed by source types, so a second
      // pass over already-projected clones would not recognize them.
      namespace =
        mutators.length === 0
          ? program.getGlobalNamespaceType()
          : (mutateSubgraphWithNamespace(program, mutators, program.getGlobalNamespaceType())
              .type as Namespace);
      return namespace;
    },
  };
}
