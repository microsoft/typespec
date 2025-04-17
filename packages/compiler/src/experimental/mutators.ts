import { compilerAssert } from "../core/diagnostics.js";
import { getLocationContext } from "../core/helpers/location-context.js";
import { Program } from "../core/program.js";
import { isTemplateInstance, isType } from "../core/type-utils.js";
import {
  DecoratedType,
  Decorator,
  DecoratorArgument,
  FunctionParameter,
  IntrinsicType,
  Model,
  Namespace,
  TemplatedType,
  TemplateParameter,
  Type,
  TypeMapper,
} from "../core/types.js";
import { CustomKeyMap } from "../utils/custom-key-map.js";
import { mutate } from "../utils/misc.js";
import { Realm } from "./realm.js";
import { $ } from "./typekit/index.js";

// #region Types

/**
 * A description of how a specific kind of type should be mutated.
 *
 * This can either be an object specifying an optional `filter` function and one of `mutate` or `replace`, or simply a
 * function that mutates the type.
 *
 * If a function is provided, it is equivalent to providing an object with a `mutate` function and no `filter` function.
 *
 * @experimental
 */
export type MutatorRecord<T extends Type> =
  | MutatorReplaceRecord<T>
  | MutatorMutateRecord<T>
  | MutatorFn<T>;

/**
 * Common functionality for mutator records.
 *
 * @experimental
 */
export interface MutatorRecordCommon<T extends Type> {
  /**
   * A filter function that determines if the mutator should be applied to the type.
   */
  filter?: MutatorFilterFn<T>;
}

/**
 * A mutator that replaces a type's clone with a new type instance.
 *
 * @experimental
 */
export interface MutatorReplaceRecord<T extends Type> extends MutatorRecordCommon<T> {
  /**
   * A mutator function that returns a new type instance to replace the cloned type instance.
   */
  replace: MutatorReplaceFn<T>;
}

/**
 * A mutator that changes the clone of a type in place.
 *
 * @experimental
 */
export interface MutatorMutateRecord<T extends Type> extends MutatorRecordCommon<T> {
  /**
   * A mutator function that edits the clone of the type in place.
   */
  mutate: MutatorFn<T>;
}

/**
 * Edits the clone of the type in place. This function _SHOULD NOT_ modify the source type.
 *
 * @see {@link mutateSubgraph}
 *
 * @param sourceType - The source type.
 * @param clone - The clone of the source type to mutate.
 * @param program - The program in which the `sourceType` occurs.
 * @param realm - The realm in which the `clone` resides.
 *
 * @experimental
 */
export type MutatorFn<T extends Type> = (
  sourceType: T,
  clone: T,
  program: Program,
  realm: Realm,
) => void;

/**
 * Determines if the mutator should be applied to the type.
 *
 * This function may either return a boolean or {@link MutatorFlow} flags:
 *
 * - If `true`, the mutator will be applied and will recur (equivalent to `MutatorFlags.MutateAndRecur`).
 * - If `false`, the mutator will not be applied and will recur (equivalent to `MutatorFlags.DoNotMutate`).
 *
 * This predicate runs before the type is cloned.
 *
 * @param sourceType - The source type.
 * @param program - The program in which the `sourceType` occurs.
 * @param realm - The realm where the `sourceType` will be cloned, if this type is mutated.
 *
 * @returns a boolean or {@link MutatorFlow} flags.
 *
 * @experimental
 */
export type MutatorFilterFn<T extends Type> = (
  sourceType: T,
  program: Program,
  realm: Realm,
) => boolean | MutatorFlow;

/**
 * A function that replaces a mutable type with a new type instance.
 *
 * Returning `clone` from this function is equivalent to providing a `mutate` function instead of a `replace` function.
 *
 * This function runs after the `sourceType` is cloned within the realm.
 *
 * @param sourceType - The source type.
 * @param clone - The clone of the source type to mutate.
 * @param program - The program in which the `sourceType` occurs.
 * @param realm - The realm in which the `clone` resides.
 *
 * @returns a new type instance to replace the cloned type instance.
 *
 * @experimental
 */
export type MutatorReplaceFn<T extends Type> = (
  sourceType: T,
  clone: T,
  program: Program,
  realm: Realm,
) => Type;

/**
 * Mutators describe procedures for mutating types in the type graph.
 *
 * Each entry in the mutator describes how to mutate a specific type of node.
 *
 * See {@link mutateSubgraph}.
 *
 * @experimental
 */
export type Mutator = {
  /**
   * The name of this mutator.
   */
  name: string;
} & {
  /**
   * Describes how to mutate a type with the given node kind.
   */
  [Kind in MutableType["kind"]]?: MutatorRecord<Extract<MutableType, { kind: Kind }>>;
};

/**
 * A mutator that can additionally mutate namespaces.
 *
 * @experimental
 */
export type MutatorWithNamespace = Mutator & Partial<NamespaceMutator>;

type NamespaceMutator = {
  Namespace?: MutatorRecord<Namespace>;
};

// TODO: better name?
type MutatorAll = Mutator & NamespaceMutator;

/**
 * Flow control for mutators.
 *
 * When filtering types in a mutator, the filter function may return MutatorFlow flags to control how mutation should
 * proceed.
 *
 * @see {@link MutatorFilterFn}
 *
 * @experimental
 */
export enum MutatorFlow {
  /**
   * Mutate the type and recur, further mutating the type's children. This is the default behavior.
   */
  MutateAndRecur = 0,
  /**
   * If this flag is set, the type will not be mutated.
   */
  DoNotMutate = 1 << 0,
  /**
   * If this flag is set, the mutator will not proceed recursively into the children of the type.
   */
  DoNotRecur = 1 << 1,
}

/**
 * A type that can be mutated.
 *
 * @see {@link mutateSubgraph}
 *
 * @experimental
 */
export type MutableType = Exclude<
  Type,
  TemplateParameter | IntrinsicType | Decorator | FunctionParameter | Namespace
>;

/**
 * Determines if a type is mutable.
 *
 * @experimental
 */
function isMutableTypeWithNamespace(type: Type): type is MutableTypeWithNamespace {
  switch (type.kind) {
    case "TemplateParameter":
    case "Intrinsic":
    case "Decorator":
    case "FunctionParameter":
      return false;
    default:
      void (type satisfies MutableTypeWithNamespace);
      return true;
  }
}

/**
 * Determines if a type is mutable.
 *
 * @experimental
 */
export function isMutableType(type: Type): type is MutableType {
  switch (type.kind) {
    case "TemplateParameter":
    case "Intrinsic":
    case "Decorator":
    case "FunctionParameter":
    case "Namespace":
      return false;
    default:
      void (type satisfies MutableType);
      return true;
  }
}

/**
 * A mutable type, inclusive of namespaces.
 *
 * @experimental
 */
export type MutableTypeWithNamespace = MutableType | Namespace;

// #endregion

// #region Mutator Application

const typeId = CustomKeyMap.objectKeyer();
const mutatorId = CustomKeyMap.objectKeyer();
const seen = new CustomKeyMap<[MutableTypeWithNamespace, Set<Mutator> | Mutator[]], Type>(
  ([type, mutators]) => {
    const key = `${typeId.getKey(type)}-${[...mutators.values()]
      .map((v) => mutatorId.getKey(v))
      .join("-")}`;
    return key;
  },
);

/**
 * Mutate the type graph, allowing namespaces to be mutated.
 *
 * **Warning**: This function will likely mutate the entire type graph. Most TypeSpec types relate to namespaces
 * in some way (e.g. through namespace parent links, or the `namespace` property of a Model).
 *
 * @param program - The program in which the `type` occurs.
 * @param mutators - An array of mutators to apply to the type graph rooted at `type`.
 * @param type - The type to mutate.
 *
 * @returns an object containing the mutated `type` and a nullable `Realm` in which the mutated type resides.
 *
 * @see {@link mutateSubgraph}
 *
 * @experimental
 */
export function mutateSubgraphWithNamespace(
  program: Program,
  mutators: MutatorWithNamespace[],
  type: Namespace,
): { realm: Realm | null; type: MutableTypeWithNamespace } {
  const engine = createMutatorEngine(program, mutators, {
    mutateNamespaces: true,
  });
  const mutated = engine.mutate(type);
  if (mutated === type) {
    return { realm: null, type };
  }
  return { realm: engine.realm, type: mutated };
}

/**
 * Mutate the type graph.
 *
 * Mutators clone the input `type`, creating a new type instance that is mutated in place.
 *
 * The mutator returns the mutated type and optionally a `realm` in which the mutated clone resides.
 *
 * @see {@link Mutator}
 * @see {@link Realm}
 *
 * **Warning**: Mutators _SHOULD NOT_ modify the source type. Modifications to the source type
 * will be visible to other emitters or libraries that view the original source type, and will
 * be sensitive to the order in which the mutator was applied. Only edit the `clone` type.
 * Furthermore, mutators must take care not to modify elements of the source and clone types
 * that are shared between the two types, such as the properties of any parent references
 * or the `decorators` of the type without taking care to clone them first.
 *
 * @param program - The program in which the `type` occurs.
 * @param mutators - An array of mutators to apply to the type graph rooted at `type`.
 * @param type - The type to mutate.
 *
 * @returns an object containing the mutated `type` and a nullable `Realm` in which the mutated type resides.
 *
 * @experimental
 */
export function mutateSubgraph<T extends MutableType>(
  program: Program,
  mutators: Mutator[],
  type: T,
): { realm: Realm | null; type: MutableType } {
  const engine = createMutatorEngine(program, mutators, {
    mutateNamespaces: false,
  });
  const mutated = engine.mutate(type);
  if (mutated === type) {
    return { realm: null, type };
  }
  return { realm: engine.realm, type: mutated };
}

interface MutatorEngineOptions {
  readonly mutateNamespaces: boolean;
}

interface MutatorEngine {
  readonly realm: Realm;
  mutate(type: MutableType): MutableType;
  mutate(type: MutableTypeWithNamespace): MutableTypeWithNamespace;
}

interface MutatorWithOptions<T extends MutableTypeWithNamespace> {
  mutator: MutatorAll;
  mutationFn: MutatorFn<T> | null;
  replaceFn: MutatorReplaceFn<T> | null;
}

function createMutatorEngine(
  program: Program,
  mutators: MutatorAll[],
  options: MutatorEngineOptions,
): MutatorEngine {
  const realm = new Realm(program, `Mutator realm ${mutators.map((m) => m.name).join(", ")}`);
  const interstitialFunctions: (() => void)[] = [];

  let preparingNamespace = false;
  const muts: Set<MutatorAll> = new Set(mutators);
  const postVisits: (() => void)[] = [];
  const namespacesVisitedContent = new Set<Namespace>();

  // If we are mutating namespace we need to make sure we mutate everything first
  if (options.mutateNamespaces) {
    preparingNamespace = true;
    // Prepare namespaces first
    mutateSubgraphWorker(program.getGlobalNamespaceType(), muts);
    preparingNamespace = false;

    postVisits.forEach((visit) => visit());
  }

  return {
    realm,
    mutate: (type) => {
      return mutateSubgraphWorker(type, muts) as any;
    },
  };

  /** Resolve the mutators to apply. */
  function resolveMutators<T extends MutableTypeWithNamespace>(
    activeMutators: Set<MutatorAll>,
    type: T,
  ) {
    const mutatorsWithOptions: MutatorWithOptions<T>[] = [];
    const newMutators = new Set(activeMutators.values());

    // step 1: see what mutators to run
    for (const mutator of activeMutators) {
      const record = mutator[type.kind] as MutatorRecord<T> | undefined;
      if (!record) {
        continue;
      }

      let mutationFn: MutatorFn<T> | null = null;
      let replaceFn: MutatorReplaceFn<T> | null = null;

      let mutate = false;
      let recurse = false;

      if (typeof record === "function") {
        mutationFn = record;
        mutate = true;
        recurse = true;
      } else {
        mutationFn = "mutate" in record ? record.mutate : null;
        replaceFn = "replace" in record ? record.replace : null;

        if (record.filter) {
          const filterResult = record.filter(type, program, realm);
          if (filterResult === true) {
            mutate = true;
            recurse = true;
          } else if (filterResult === false) {
            mutate = false;
            recurse = true;
          } else {
            mutate = (filterResult & MutatorFlow.DoNotMutate) === 0;
            recurse = (filterResult & MutatorFlow.DoNotRecur) === 0;
          }
        } else {
          mutate = true;
          recurse = true;
        }
      }

      if (!recurse) {
        newMutators.delete(mutator);
      }

      if (mutate) {
        mutatorsWithOptions.push({ mutator, mutationFn, replaceFn });
      }
    }
    return { mutatorsWithOptions, newMutators };
  }

  function applyMutations<T extends MutableTypeWithNamespace>(
    type: T,
    clone: T,
    mutatorsWithOptions: MutatorWithOptions<T>[],
  ) {
    let resolved: MutableTypeWithNamespace = clone;
    for (const { mutationFn, replaceFn } of mutatorsWithOptions) {
      // todo: handle replace earlier in the mutation chain
      const result: MutableType = (mutationFn! ?? replaceFn!)(
        type,
        resolved as any,
        program,
        realm,
      ) as any;

      if (replaceFn && result !== undefined) {
        resolved = result;
      }
    }

    return resolved;
  }

  function mutateSubgraphWorker<T extends MutableTypeWithNamespace>(
    type: T,
    activeMutators: Set<MutatorAll>,
    mutateSubNamespace: boolean = true,
  ): MutableTypeWithNamespace {
    let existing = seen.get([type, activeMutators]);
    if (existing) {
      if (
        mutateSubNamespace &&
        existing.kind === "Namespace" &&
        !namespacesVisitedContent.has(existing as any)
      ) {
        namespacesVisitedContent.add(existing);
        mutateSubMap(existing, "namespaces", true, activeMutators);
      }
      clearInterstitialFunctions();
      return existing as T;
    }
    // Mutating compiler types breaks a lot of things in the type checker. It is better to keep any of those as they are.
    if (getLocationContext(program, type).type === "compiler" && !isTemplateInstance(type)) {
      return type;
    }
    let clone: MutableTypeWithNamespace | null = null;

    const { mutatorsWithOptions, newMutators } = resolveMutators(activeMutators, type);
    const mutatorsToApply = mutatorsWithOptions.map((v) => v.mutator);

    let mutating = false;

    // if we have no mutators to apply, let's bail out.
    if (mutatorsWithOptions.length === 0) {
      if (newMutators.size > 0) {
        // we might need to clone this type later if something in our subgraph needs mutated.
        interstitialFunctions.push(initializeClone);
        seen.set([type, activeMutators], type);
        visitSubgraph();
        visitParents();
        interstitialFunctions.pop();
        return clone ?? type;
      } else {
        // we don't need to clone this type, so let's just return it.
        return type;
      }
    }

    clearInterstitialFunctions();

    // step 2: see if we need to mutate based on the set of mutators we're actually going to run
    existing = seen.get([type, mutatorsToApply]);
    if (existing) {
      return existing as T;
    }

    // step 3: run the mutators
    initializeClone();

    const result = applyMutations(type, clone as any, mutatorsWithOptions);
    if (result !== clone) {
      clone = result;
      seen.set([type, activeMutators], clone);
      seen.set([type, mutatorsToApply], clone);
    }

    if (newMutators.size > 0) {
      if (preparingNamespace && type.kind === "Namespace") {
        compilerAssert(mutating, "Cannot be preparing namespaces and not have cloned it.");
        prepareNamespace(clone as any);
        postVisits.push(() => visitNamespaceContents(clone as any));
      } else {
        visitSubgraph();
      }
    }

    if (type.isFinished) {
      $(realm).type.finishType(clone!);
    }

    if (type.kind === "Namespace" && mutateSubNamespace) {
      compilerAssert(mutating, "Cannot be preparing namespaces and not have cloned it.");
      visitSubNamespaces(clone as any);
    }
    if (type.kind !== "Namespace") {
      visitParents();
    }
    return clone!;

    function initializeClone() {
      clone = $(realm).type.clone(type);
      mutating = true;
      seen.set([type, activeMutators], clone);
      seen.set([type, mutatorsToApply], clone);
    }

    function clearInterstitialFunctions() {
      for (const interstitial of interstitialFunctions) {
        interstitial();
      }

      interstitialFunctions.length = 0;
    }

    function mutateNamespaceProperty(root: MutableTypeWithNamespace) {
      if (!options.mutateNamespaces) {
        return;
      }
      if ("namespace" in root && root.namespace) {
        const newNs = mutateSubgraphWorker(root.namespace, newMutators, false);
        compilerAssert(newNs.kind === "Namespace", `Expected to be mutated to a namespace`);
        (clone as any).namespace = newNs;
      }
    }

    function prepareNamespace(root: Namespace) {
      visitDecorators(root, true, newMutators);
      mutateNamespaceProperty(root);
    }

    function visitSubNamespaces(type: Namespace) {
      namespacesVisitedContent.add(type);
      mutateSubMap(type, "namespaces", true, newMutators);
    }
    function visitNamespaceContents(root: Namespace) {
      mutateSubMap(root, "models", mutating, newMutators);
      mutateSubMap(root, "operations", mutating, newMutators);
      mutateSubMap(root, "interfaces", mutating, newMutators);
      mutateSubMap(root, "enums", mutating, newMutators);
      mutateSubMap(root, "unions", mutating, newMutators);
      mutateSubMap(root, "scalars", mutating, newMutators);
    }

    function visitModel(root: Model) {
      mutateSubMap(root, "properties", mutating, newMutators);
      if (root.indexer) {
        const res = mutateSubgraphWorker(root.indexer.value as any, newMutators);
        if (mutating) {
          (root as any).indexer.value = res;
        }
      }
      for (const [index, prop] of root.sourceModels.entries()) {
        const newModel: any = mutateSubgraphWorker(prop.model, newMutators);
        if (mutating) {
          mutate(root.sourceModels[index]).model = newModel;
        }
      }
      mutateProperty(root, "sourceModel", mutating, newMutators);
      mutateProperty(root, "baseModel", mutating, newMutators);
      mutateSubArray(root, "derivedModels", mutating, newMutators);
    }

    function visitSubgraph() {
      const root: MutableTypeWithNamespace = clone ?? type;
      switch (root.kind) {
        case "Namespace":
          visitNamespaceContents(root);
          break;
        case "Model":
          visitModel(root);
          break;
        case "ModelProperty":
          mutateProperty(root, "type", mutating, newMutators);
          mutateProperty(root, "sourceProperty", mutating, newMutators);
          break;
        case "Operation":
          mutateProperty(root, "parameters", mutating, newMutators);
          mutateProperty(root, "returnType", mutating, newMutators);
          mutateProperty(root, "sourceOperation", mutating, newMutators);
          break;
        case "Interface":
          mutateSubMap(root, "operations", mutating, newMutators);
          break;
        case "Enum":
          mutateSubMap(root, "members", mutating, newMutators);
          break;
        case "EnumMember":
          break;
        case "Union":
          mutateSubMap(root, "variants", mutating, newMutators);
          break;
        case "UnionVariant":
          mutateProperty(root, "type", mutating, newMutators);
          break;
        case "Scalar":
          mutateSubMap(root, "constructors", mutating, newMutators);
          mutateProperty(root, "baseScalar", mutating, newMutators);
          mutateSubArray(root, "derivedScalars", mutating, newMutators);
          break;
        case "ScalarConstructor":
          mutateProperty(root, "scalar", mutating, newMutators);
          break;
      }

      if ("templateMapper" in root) {
        mutateTemplateMapper(root, mutating, newMutators);
      }
      if ("decorators" in root) {
        visitDecorators(root, mutating, newMutators);
      }
      mutateNamespaceProperty(root);
    }

    // Parents needs to be visited after the type is finished
    function visitParents() {
      const root: MutableType | Namespace = clone ?? (type as MutableTypeWithNamespace);
      switch (root.kind) {
        case "ModelProperty":
          mutateProperty(root, "model", mutating, newMutators);
          break;
        case "Operation":
          mutateProperty(root, "interface", mutating, newMutators);
          break;
        case "EnumMember":
          mutateProperty(root, "enum", mutating, newMutators);
          break;
        case "UnionVariant":
          mutateProperty(root, "union", mutating, newMutators);
          break;
        case "ScalarConstructor":
          mutateProperty(root, "scalar", mutating, newMutators);
          break;
      }
    }
  }

  function visitDecorators(
    type: MutableTypeWithNamespace & DecoratedType,
    mutating: boolean,
    newMutators: Set<MutatorAll>,
  ) {
    for (const [index, dec] of type.decorators.entries()) {
      const args: DecoratorArgument[] = [];
      for (const arg of dec.args) {
        const jsValue =
          typeof arg.jsValue === "object" &&
          arg.jsValue !== null &&
          isType(arg.jsValue as any) &&
          isMutableTypeWithNamespace(arg.jsValue as any)
            ? mutateSubgraphWorker(arg.jsValue as any, newMutators)
            : arg.jsValue;
        args.push({
          ...arg,
          value:
            isType(arg.value) && isMutableTypeWithNamespace(arg.value)
              ? mutateSubgraphWorker(arg.value, newMutators)
              : arg.value,
          jsValue,
        });
      }

      if (mutating) {
        type.decorators[index] = { ...dec, args };
      }
    }
  }

  function mutateTemplateMapper(
    type: TemplatedType,
    mutating: boolean,
    newMutators: Set<MutatorAll>,
  ) {
    if (type.templateMapper === undefined) {
      return;
    }
    const mutatedMapper: TypeMapper = {
      ...type.templateMapper,
      args: [],
      map: new Map(),
    };
    for (const arg of type.templateMapper.args) {
      mutate(mutatedMapper.args).push(mutateSubgraphWorker(arg as any, newMutators));
    }
    for (const [param, paramType] of type.templateMapper.map) {
      mutatedMapper.map.set(param, mutateSubgraphWorker(paramType as any, newMutators));
    }
    if (mutating) {
      type.templateMapper = mutatedMapper;
    }
  }

  function mutateSubMap<T extends MutableTypeWithNamespace, K extends keyof T>(
    type: T,
    prop: K,
    mutate: boolean,
    newMutators: Set<MutatorAll>,
  ) {
    for (const [key, value] of (type as any)[prop].entries()) {
      const newValue: any = mutateSubgraphWorker(value, newMutators);
      if (mutate) {
        (type[prop] as any).set(key, newValue);

        if (newValue.name !== value.name) {
          (type[prop] as any).rekey(key, newValue.name);
        }
      }
    }
  }
  function mutateSubArray<T extends MutableType, K extends keyof T>(
    type: T,
    prop: K,
    mutate: boolean,
    newMutators: Set<MutatorAll>,
  ) {
    for (const [index, value] of (type as any)[prop].entries()) {
      const newValue: any = mutateSubgraphWorker(value, newMutators);

      if (mutate) {
        (type as any)[prop][index] = newValue;
      }
    }
  }

  function mutateProperty<T extends MutableType, K extends keyof T>(
    type: T,
    prop: K,
    mutating: boolean,
    newMutators: Set<Mutator>,
  ) {
    if (type[prop] === undefined) {
      return;
    }
    const newValue: any = mutateSubgraphWorker(type[prop] as any, newMutators);
    if (mutating) {
      type[prop] = newValue;
    }
  }
}

// #endregion
