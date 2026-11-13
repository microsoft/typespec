import { getAutoDecoratorValue } from "../core/auto-decorator.js";
import { isCompilerFeatureEnabled } from "../core/features.js";
import { getTypeName } from "../core/helpers/type-name-utils.js";
import { createDiagnostic } from "../core/messages.js";
import { visitChildren } from "../core/parser.js";
import type { Program } from "../core/program.js";
import {
  getScopeAlternatives,
  matchesScope,
  resolveWhenClause,
  scopeAlternativesKey,
  scopeParentKey,
  scopeUniverseKey,
  selectMostSpecific,
  type Scope,
  type ScopeAlternatives,
  type ScopeConditionSet,
  type ScopedDecoratorEntry,
} from "../core/scope.js";
import { navigateProgram, navigateType } from "../core/semantic-walker.js";
import { isTemplateDeclaration, isType } from "../core/type-utils.js";
import type {
  Diagnostic,
  Enum,
  EnumMember,
  Namespace,
  Node,
  Operation,
  RekeyableMap,
  TemplatedType,
  Type,
} from "../core/types.js";
import { SyntaxKind } from "../core/types.js";
import {
  getDefaultVisibilityClasses,
  getRawVisibilityStore,
  isVisible,
} from "../core/visibility/core.js";
import {
  mutateSubgraph,
  mutateSubgraphWithNamespace,
  type MutatorWithNamespace,
} from "./mutators.js";
import { Realm } from "./realm.js";

/** An adapter contributes an existing library's projection, not a second compilation. */
export interface ScopeViewAxis {
  readonly enum: Enum;
  readonly ordered?: boolean;
  readonly isValidSelection?: (selection: EnumMember, selections: readonly EnumMember[]) => boolean;
  readonly project?: (selection: EnumMember) => MutatorWithNamespace;
  readonly isPresent?: (selection: EnumMember, type: Type) => boolean;
}

export interface ScopeView {
  readonly name: string;
  readonly selections: readonly EnumMember[];
  isPresent(type: Type): boolean;
  getType<T extends Type>(type: T): T;
  getGlobalNamespaceType(): Namespace;
  /** Query-only facade for existing library APIs. The original checker is not view-aware. */
  getProgram(): Program;
  getAutoDecoratorValue(decorator: string, type: Type): Record<string, unknown> | undefined;
}

interface ScopeViewState {
  axes: Map<Enum, ScopeViewAxis>;
  conditions: Map<Node, ScopeConditionSet>;
  views: ScopeView[];
  validated: boolean;
  validators: ((view: ScopeView) => readonly Diagnostic[])[];
}

const stateKey = Symbol.for("TypeSpec.Scopes.views");

function state(program: Program): ScopeViewState {
  const map = program.stateMap(stateKey);
  const root = program.getGlobalNamespaceType();
  let value = map.get(root) as ScopeViewState | undefined;
  if (!value) {
    value = { axes: new Map(), conditions: new Map(), views: [], validated: false, validators: [] };
    map.set(root, value);
  }
  return value;
}

/** Register during compilation/validation, never when an emitter first requests a view. */
export function registerScopeViewAxis(program: Program, axis: ScopeViewAxis): void {
  state(program).axes.set(axis.enum, axis);
}

/** Opt-in library rules run on every view, independent of emitter/viewer selection. */
export function registerScopeViewValidator(
  program: Program,
  validator: (view: ScopeView) => readonly Diagnostic[],
): void {
  state(program).validators.push(validator);
}

/** Returns the views already checked by the compiler. Does not trigger validation. */
export function getScopeViews(program: Program): readonly ScopeView[] {
  return state(program).views;
}

export function hasScopeConditions(program: Program): boolean {
  let found = false;
  const visit = (node: Node): void => {
    if ("when" in node && node.when) found = true;
    if (!found) visitChildren(node, visit);
  };
  for (const file of program.sourceFiles.values()) {
    if (!found) visit(file);
  }
  return found;
}

/** Exhaustive finite enumeration is intentional in this feasibility POC. */
export function validateScopeViews(program: Program): void {
  if (!hasScopeConditions(program)) return;
  const data = state(program);
  if (data.validated) return;
  data.validated = true;

  const collect = (node: Node): void => {
    if ("when" in node && node.when) {
      if (!isCompilerFeatureEnabled(program, "scoped-decorators", node.when)) {
        // Decorator clauses are already checked by the checker.
        if (!("arguments" in node)) {
          program.reportDiagnostic(
            createDiagnostic({ code: "scoped-decorator-disabled", target: node.when }),
          );
        }
      } else {
        const condition = resolveWhenClause(program, node.when);
        if (condition) {
          data.conditions.set(node, condition);
          for (const item of condition.conditions) {
            if (item.dimension === "enum" && !data.axes.has(item.value.enum)) {
              data.axes.set(item.value.enum, { enum: item.value.enum });
            }
          }
        }
      }
    }
    visitChildren(node, collect);
  };
  for (const file of program.sourceFiles.values()) collect(file);

  // String selectors remain supported by the original metadata spike. They do not
  // establish a closed universe and therefore are not used for structural views.
  for (const [node, condition] of data.conditions) {
    if (
      condition.conditions.some((c) => c.dimension !== "enum") &&
      (!("arguments" in node) || data.axes.size > 0)
    ) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-scope-condition",
          messageId: "legacySelector",
          target: node,
        }),
      );
      return;
    }
    if (
      condition.conditions.some(
        (c) => c.dimension === "enum" && c.relation && !data.axes.get(c.value.enum)?.ordered,
      )
    ) {
      program.reportDiagnostic(
        createDiagnostic({
          code: "invalid-scope-condition",
          messageId: "range",
          target: node,
        }),
      );
      return;
    }
  }
  if (data.axes.size === 0) return;
  let hierarchyError = false;
  for (const [member, parent] of program.stateMap(scopeParentKey) as Map<EnumMember, EnumMember>) {
    const seen = new Set<EnumMember>([member]);
    let current: EnumMember | undefined = parent;
    while (current) {
      if (current.enum !== member.enum || seen.has(current)) {
        program.reportDiagnostic(
          createDiagnostic({ code: "invalid-scope-hierarchy", target: member }),
        );
        hierarchyError = true;
        break;
      }
      seen.add(current);
      current = program.stateMap(scopeParentKey).get(current);
    }
    if (hierarchyError) break;
  }
  if (hierarchyError) return;

  const allTypes = new Set<Type>();
  const remember = (type: Type) => {
    allTypes.add(type);
  };
  navigateProgram(program, {
    namespace: remember,
    model: remember,
    modelProperty: remember,
    operation: remember,
    interface: remember,
    scalar: remember,
    enum: remember,
    enumMember: remember,
    union: remember,
    unionVariant: remember,
    tuple: remember,
  });
  for (const type of allTypes) {
    if (type.kind !== "ModelProperty") continue;
    for (const axis of getRawVisibilityStore(program, type)?.keys() ?? []) {
      if (!data.axes.has(axis)) data.axes.set(axis, { enum: axis });
    }
  }

  for (const axis of getDefaultVisibilityClasses(program)) {
    if (!data.axes.has(axis)) data.axes.set(axis, { enum: axis });
  }

  let selections: EnumMember[][] = [[]];
  for (const axis of data.axes.values()) {
    selections = selections.flatMap((selection) =>
      [...axis.enum.members.values()].map((member) => [...selection, member]),
    );
  }
  selections = selections.filter((selection) =>
    selection.every(
      (member) => data.axes.get(member.enum)?.isValidSelection?.(member, selection) !== false,
    ),
  );
  if (selections.length === 0) {
    program.reportDiagnostic(
      createDiagnostic({
        code: "invalid-scope-condition",
        messageId: "emptyUniverse",
        target: data.axes.values().next().value!.enum,
      }),
    );
    return;
  }
  program.stateMap(scopeUniverseKey).set(
    program.getGlobalNamespaceType(),
    selections.map((selection) => ({ selections: selection })),
  );

  const reported = new Set<string>();
  function reportReference(source: Type, target: Type, view: ScopeView) {
    const key = `${getTypeName(source)}:${getTypeName(target)}`;
    if (reported.has(key)) return;
    reported.add(key);
    program.reportDiagnostic(
      createDiagnostic({
        code: "incompatible-scoped-reference",
        format: { source: getTypeName(source), target: getTypeName(target), view: view.name },
        target: Realm.sourceOf(source),
      }),
    );
  }
  function reportType(source: Type, reason: string, view: ScopeView) {
    const key = `relationship:${getTypeName(source)}:${reason}`;
    if (reported.has(key)) return;
    reported.add(key);
    program.reportDiagnostic(
      createDiagnostic({
        code: "invalid-scoped-type",
        format: { view: view.name, reason },
        target: Realm.sourceOf(source),
      }),
    );
  }

  for (const selection of selections) {
    const scope: Scope = { selections: selection };
    const view = createView(program, data, scope, reported);
    data.views.push(view);
    validateMetadata(program, view, scope, reported, reportReference);
    const root = view.getGlobalNamespaceType();
    const edge = (source: Type, target: Type | undefined) => {
      if (target && view.isPresent(source) && !view.isPresent(target))
        reportReference(source, target, view);
    };
    const checkInstantiation = (type: TemplatedType) => {
      if (!view.isPresent(type) || !type.templateMapper || isTemplateDeclaration(type)) return;
      for (const [parameter, argument] of type.templateMapper.map) {
        if (parameter.node.parent !== type.node) continue;
        if (argument.entityKind !== "Type") continue;
        edge(type, argument);
        if (!parameter.constraint?.type) continue;
        const [valid, diagnostics] = program.checker.isTypeAssignableTo(
          view.getType(argument),
          view.getType(parameter.constraint.type),
          type,
        );
        if (!valid) reportType(type, diagnostics.map((d) => d.message).join(" "), view);
      }
    };
    navigateType(
      root,
      {
        model(model) {
          edge(model, model.baseModel);
          for (const source of model.sourceModels) {
            edge(model, source.model);
            checkInstantiation(source.model);
          }
          if (model.indexer) edge(model, model.indexer.value);
          checkInstantiation(model);
        },
        modelProperty(property) {
          edge(property, property.type);
          if (!view.isPresent(property)) return;
          let base = property.model?.baseModel;
          while (base) {
            const inherited = base.properties.get(property.name);
            if (inherited) {
              const [valid] = program.checker.isTypeAssignableTo(
                property.type,
                inherited.type,
                property,
              );
              if (!valid || (!inherited.optional && property.optional)) {
                reportType(
                  property,
                  `Property '${property.name}' is incompatible with its base property.`,
                  view,
                );
              }
              break;
            }
            base = base.baseModel;
          }
        },
        operation(operation) {
          // Re-pointing `is` at another branch per view would require re-checking the
          // derived signature; the prototype reports it instead of using the first branch.
          if (
            operation.sourceOperation &&
            getScopeAlternatives(program, Realm.sourceOf(operation.sourceOperation)) &&
            !getScopeAlternatives(program, Realm.sourceOf(operation))
          ) {
            reportType(
              operation,
              "Operations cannot use 'is' with an operation alternatives group in this prototype.",
              view,
            );
          } else {
            edge(operation, operation.sourceOperation);
          }
          edge(operation, operation.returnType);
          checkInstantiation(operation);
          if (operation.sourceOperation) checkInstantiation(operation.sourceOperation);
        },
        interface(type) {
          checkInstantiation(type);
          for (const source of type.sourceInterfaces) {
            edge(type, source);
            checkInstantiation(source);
          }
        },
        scalar(scalar) {
          edge(scalar, scalar.baseScalar);
          checkInstantiation(scalar);
        },
        union(union) {
          checkInstantiation(union);
        },
        unionVariant(variant) {
          edge(variant, variant.type);
        },
        tuple(tuple) {
          for (const value of tuple.values) edge(tuple, value);
        },
      },
      { includeTemplateDeclaration: true },
    );
    validateAlternatives(program, data, view, scope, reported);
    for (const validator of data.validators) program.reportDiagnostics(validator(view));
  }
}

function validateAlternatives(
  program: Program,
  data: ScopeViewState,
  view: ScopeView,
  scope: Scope,
  reported: Set<string>,
): void {
  const groups = new Set(
    program.stateMap(scopeAlternativesKey).values() as Iterable<ScopeAlternatives>,
  );
  for (const group of groups) {
    const conditions = group.branches.map((branch) =>
      branch.when ? data.conditions.get(branch) : undefined,
    );
    const { ambiguous } = selectMostSpecific(program, scope, conditions);
    const key = `alternatives:${group.branches[0].pos}:${group.branches[0].end}`;
    if (!ambiguous || reported.has(key)) continue;
    reported.add(key);
    const matching = group.branches.filter(
      (branch, i) => conditions[i] && matchesScope(scope, conditions[i]!, program),
    );
    program.reportDiagnostic(
      createDiagnostic({
        code: "ambiguous-scoped-alternative",
        format: {
          view: view.name,
          branches: matching.map((branch) => `'${branchText(branch)}'`).join(", "),
        },
        target: matching[0] ?? group.branches[0],
      }),
    );
  }
}

function branchText(node: Node & { readonly when?: Node }): string {
  let file: Node | undefined = node;
  while (file && !("file" in file && file.kind === SyntaxKind.TypeSpecScript)) file = file.parent;
  const target = node.when ?? node;
  return file && "file" in file && file.kind === SyntaxKind.TypeSpecScript
    ? file.file.text.slice(target.pos, target.end)
    : "else";
}

function createView(
  program: Program,
  data: ScopeViewState,
  scope: Scope,
  reported: Set<string>,
): ScopeView {
  const selection = scope.selections!;
  const viewName = selection.map((x) => getTypeName(x)).join(" / ");
  const selectAlternative = (group: ScopeAlternatives): Type | undefined => {
    const { index } = selectMostSpecific(
      program,
      scope,
      group.branches.map((branch) => (branch.when ? data.conditions.get(branch) : undefined)),
    );
    return index === undefined ? undefined : group.members[index];
  };
  const alternativesOf = (type: Type) => getScopeAlternatives(program, Realm.sourceOf(type));
  const isAlternativesOwner = (type: Type) => {
    const source = Realm.sourceOf(type);
    return alternativesOf(source)?.owner === source;
  };
  const resolveAlternatives = (type: Type): Type => {
    if (!isAlternativesOwner(type)) return type;
    const selected = selectAlternative(alternativesOf(type)!);
    return selected?.kind === "UnionVariant" ? selected.type : type;
  };
  const present = (type: Type, seen = new Set<Type>()): boolean => {
    type = Realm.sourceOf(type);
    if (seen.has(type)) return true;
    seen.add(type);
    const group = getScopeAlternatives(program, type);
    if (group && group.owner !== type) {
      if (selectAlternative(group) !== type) return false;
    } else {
      const condition = type.node && data.conditions.get(type.node);
      if (condition && !matchesScope(scope, condition, program)) return false;
    }
    for (const member of selection) {
      if (data.axes.get(member.enum)?.isPresent?.(member, type) === false) return false;
    }
    if ("namespace" in type && type.namespace && !present(type.namespace, seen)) return false;
    switch (type.kind) {
      case "ModelProperty":
        // A property typed by alternatives with no branch for this view is absent.
        if (isAlternativesOwner(type.type) && !selectAlternative(alternativesOf(type.type)!))
          return false;
        if (type.model && !present(type.model, seen)) return false;
        if (type.sourceProperty && !present(type.sourceProperty, seen)) return false;
        for (const member of selection) {
          if (!isVisible(program, type, { any: new Set([member]) })) return false;
        }
        return true;
      case "UnionVariant":
        return present(type.union, seen);
      case "EnumMember":
        return present(type.enum, seen);
      case "Operation":
        return !type.interface || present(type.interface, seen);
      default:
        return true;
    }
  };
  const projected = new Map<Type, Type>();
  const siblingNames = new Map<Type, Map<string | symbol, Type>>();
  let root: Namespace | undefined;
  const record = (original: Type, clone: Type) => {
    projected.set(original, clone);
    const name = getAutoDecoratorValue(program, "TypeSpec.Scopes.name", original, scope)?.name;
    if ("name" in clone && typeof name === "string") clone.name = name;
    const owner =
      original.kind === "ModelProperty"
        ? original.model
        : original.kind === "EnumMember"
          ? original.enum
          : original.kind === "UnionVariant"
            ? original.union
            : original.kind === "Operation"
              ? (original.interface ?? original.namespace)
              : "namespace" in original
                ? original.namespace
                : undefined;
    if (
      owner &&
      "name" in clone &&
      clone.name !== undefined &&
      clone.name !== "" &&
      present(original)
    ) {
      const names = siblingNames.get(owner) ?? new Map<string | symbol, Type>();
      const previous = names.get(clone.name);
      if (previous && previous !== original && previous.node !== original.node) {
        const key = `name:${getTypeName(original)}`;
        if (!reported.has(key)) {
          reported.add(key);
          program.reportDiagnostic(
            createDiagnostic({
              code: "invalid-scoped-type",
              format: {
                view: viewName,
                reason: `Name '${String(clone.name)}' collides with '${getTypeName(previous)}'.`,
              },
              target: original,
            }),
          );
        }
      }
      names.set(clone.name, original);
      siblingNames.set(owner, names);
    }
  };
  const filter = <K>(map: Map<K, Type>) => {
    for (const [key, type] of map) if (!present(type)) map.delete(key);
  };
  const mutator: MutatorWithNamespace = {
    name: "Conditional scope view",
    Namespace(original, clone) {
      record(original, clone);
      for (const map of [
        clone.models,
        clone.scalars,
        clone.operations,
        clone.interfaces,
        clone.enums,
        clone.unions,
        clone.namespaces,
      ])
        filter(map);
      // The selected operation alternative takes the group's name in the view.
      for (const [key, operation] of [...clone.operations]) {
        if (key !== operation.name && alternativesOf(operation)) {
          (clone.operations as RekeyableMap<string, Operation>).rekey(key, operation.name);
        }
      }
    },
    Model(original, clone) {
      record(original, clone);
      filter(clone.properties);
      clone.derivedModels = clone.derivedModels.filter((x) => present(x));
    },
    ModelProperty(original, clone) {
      record(original, clone);
      clone.type = resolveAlternatives(clone.type);
      const type = getAutoDecoratorValue(program, "TypeSpec.Scopes.type", original, scope)?.type;
      if (type && typeof type === "object" && "entityKind" in type && type.entityKind === "Type") {
        clone.type = type as Type;
      }
      const optional = getAutoDecoratorValue(
        program,
        "TypeSpec.Scopes.optional",
        original,
        scope,
      )?.optional;
      if (typeof optional === "boolean") clone.optional = optional;
    },
    Operation(original, clone) {
      record(original, clone);
      clone.returnType = resolveAlternatives(clone.returnType);
      const type = getAutoDecoratorValue(
        program,
        "TypeSpec.Scopes.returnType",
        original,
        scope,
      )?.type;
      if (type && typeof type === "object" && "entityKind" in type && type.entityKind === "Type") {
        clone.returnType = type as Type;
      }
    },
    Scalar(original, clone) {
      record(original, clone);
      clone.derivedScalars = clone.derivedScalars.filter((x) => present(x));
    },
    Interface(original, clone) {
      record(original, clone);
      filter(clone.operations);
    },
    Enum(original, clone) {
      record(original, clone);
      filter(clone.members);
    },
    EnumMember: record,
    Union(original, clone) {
      record(original, clone);
      filter(clone.variants);
    },
    UnionVariant: record,
    Tuple: record,
  };
  const materialize = () => {
    if (!root) {
      const mutators = selection.flatMap((member) => {
        const project = data.axes.get(member.enum)?.project;
        return project ? [project(member)] : [];
      });
      root = mutateSubgraphWithNamespace(
        program,
        [...mutators, mutator],
        program.getGlobalNamespaceType(),
        { skipDecorators: true },
      ).type as Namespace;
    }
    return root;
  };
  let queryProgram: Program | undefined;
  const view: ScopeView = {
    name: viewName,
    selections: selection,
    isPresent: present,
    getGlobalNamespaceType: materialize,
    getType<T extends Type>(type: T): T {
      materialize();
      const source = Realm.sourceOf(type);
      if (
        !projected.has(source) &&
        source.kind !== "Namespace" &&
        source.kind !== "Intrinsic" &&
        source.kind !== "TemplateParameter" &&
        source.kind !== "Decorator" &&
        source.kind !== "FunctionParameter"
      ) {
        const mutators = selection.flatMap((member) => {
          const project = data.axes.get(member.enum)?.project;
          return project ? [project(member)] : [];
        });
        return mutateSubgraph(program, [...mutators, mutator], source, { skipDecorators: true })
          .type as T;
      }
      return (projected.get(source) ?? type) as T;
    },
    getAutoDecoratorValue(decorator, type) {
      return present(type) ? getAutoDecoratorValue(program, decorator, type, scope) : undefined;
    },
    getProgram() {
      if (!queryProgram) {
        const stateMaps = new Map<symbol, Map<Type, unknown>>();
        for (const [key, entries] of program.stateMaps) {
          if (
            key.description?.startsWith("dec-scoped:") ||
            key.description?.startsWith("TypeSpec.Scopes.")
          )
            continue;
          const map = new Map<Type, unknown>();
          for (const [type, value] of entries) {
            if (Realm.sourceOf(type) !== type || !present(type)) continue;
            map.set(view.getType(type), value);
          }
          stateMaps.set(key, map);
        }
        for (const [key, entries] of program.stateMaps) {
          if (!key.description?.startsWith("dec-scoped:")) continue;
          const decorator = key.description.slice(11);
          const mapKey = Symbol.for(`dec:${decorator}`);
          const map = stateMaps.get(mapKey) ?? new Map<Type, unknown>();
          for (const type of entries.keys()) {
            if (Realm.sourceOf(type) !== type || !present(type)) continue;
            const value = view.getAutoDecoratorValue(decorator, type);
            if (value !== undefined) map.set(view.getType(type), value);
          }
          stateMaps.set(mapKey, map);
        }
        for (const map of stateMaps.values()) {
          const get = map.get.bind(map);
          const has = map.has.bind(map);
          map.get = (type) => get(view.getType(type));
          map.has = (type) => has(view.getType(type));
        }
        queryProgram = {
          ...program,
          stateMaps,
          getGlobalNamespaceType: materialize,
          stateMap(key) {
            return stateMaps.get(key) ?? new Map();
          },
          stateSet(key) {
            return new Set(
              [...program.stateSet(key)]
                .filter((type) => present(type))
                .map((type) => view.getType(type)),
            );
          },
        };
      }
      return queryProgram;
    },
  };
  return view;
}

function validateMetadata(
  program: Program,
  view: ScopeView,
  scope: Scope,
  reported: Set<string>,
  reportReference: (source: Type, target: Type, view: ScopeView) => void,
): void {
  const universe = program
    .stateMap(scopeUniverseKey)
    .get(program.getGlobalNamespaceType()) as Scope[];
  for (const [key, map] of [...program.stateMaps]) {
    const decorator = key.description?.startsWith("dec-scoped:")
      ? key.description.slice(11)
      : undefined;
    if (!decorator) continue;
    for (const [target, rawEntries] of [...map]) {
      if (Realm.sourceOf(target) !== target || !view.isPresent(target)) continue;
      const entries = rawEntries as ScopedDecoratorEntry[];
      const matching = entries.filter(
        (entry) => entry.scope && matchesScope(scope, entry.scope, program),
      );
      const domains = matching.map(
        (entry) =>
          new Set(
            universe
              .map((candidate, i) => (matchesScope(candidate, entry.scope!, program) ? i : -1))
              .filter((i) => i >= 0),
          ),
      );
      const winners = matching.filter((_, i) =>
        domains.every(
          (other, j) =>
            i === j || (domains[i].size < other.size && [...domains[i]].every((x) => other.has(x))),
        ),
      );
      const id = `${decorator}:${getTypeName(target)}`;
      if (matching.length > 1 && winners.length !== 1 && !reported.has(id)) {
        reported.add(id);
        program.reportDiagnostic(
          createDiagnostic({
            code: "ambiguous-scoped-value",
            format: { decorator, view: view.name },
            target: matching[0].node ?? target,
          }),
        );
      }
      const value = view.getAutoDecoratorValue(decorator, target);
      const visited = new Set<object>();
      const inspect = (arg: unknown): void => {
        if (!arg || typeof arg !== "object" || visited.has(arg)) return;
        visited.add(arg);
        if ("entityKind" in arg && arg.entityKind === "Type" && isType(arg as Type)) {
          if (!view.isPresent(arg as Type)) reportReference(target, arg as Type, view);
        } else {
          for (const child of Object.values(arg)) inspect(child);
        }
      };
      inspect(value);
    }
  }
}
