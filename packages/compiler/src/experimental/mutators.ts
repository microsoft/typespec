import { Program } from "../core/program.js";
import {
  Decorator,
  FunctionParameter,
  FunctionType,
  IntrinsicType,
  Namespace,
  ObjectType,
  Projection,
  TemplateParameter,
  Type,
} from "../core/types.js";
import { CustomKeyMap } from "../emitter-framework/custom-key-map.js";
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
export type MutatorWithNamespace = Mutator & {
  Namespace: MutatorRecord<Namespace>;
};

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
  | TemplateParameter
  | IntrinsicType
  | FunctionType
  | Decorator
  | FunctionParameter
  | ObjectType
  | Projection
  | Namespace
>;

/**
 * Determines if a type is mutable.
 *
 * @experimental
 */
export function isMutableType(type: Type): type is MutableType {
  switch (type.kind) {
    case "TemplateParameter":
    case "Intrinsic":
    case "Function":
    case "Decorator":
    case "FunctionParameter":
    case "Object":
    case "Projection":
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
const seen = new CustomKeyMap<[MutableType, Set<Mutator> | Mutator[]], Type>(([type, mutators]) => {
  const key = `${typeId.getKey(type)}-${[...mutators.values()]
    .map((v) => mutatorId.getKey(v))
    .join("-")}`;
  return key;
});

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
export function mutateSubgraphWithNamespace<T extends MutableTypeWithNamespace>(
  program: Program,
  mutators: MutatorWithNamespace[],
  type: T,
): { realm: Realm | null; type: MutableTypeWithNamespace } {
  return mutateSubgraph(program, mutators, type as any);
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
  const realm = new Realm(program, "realm for mutation");
  const interstitialFunctions: (() => void)[] = [];

  const mutated = mutateSubgraphWorker(type, new Set(mutators));

  if (mutated === type) {
    return { realm: null, type };
  } else {
    return { realm, type: mutated };
  }

  function mutateSubgraphWorker<T extends MutableType>(
    type: T,
    activeMutators: Set<Mutator>,
  ): MutableType {
    let existing = seen.get([type, activeMutators]);
    if (existing) {
      clearInterstitialFunctions();
      return existing as T;
    }

    let clone: MutableType | null = null;
    const mutatorsWithOptions: {
      mutator: Mutator;
      mutationFn: MutatorFn<T> | null;
      replaceFn: MutatorReplaceFn<T> | null;
    }[] = [];

    // step 1: see what mutators to run
    const newMutators = new Set(activeMutators.values());
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

    const mutatorsToApply = mutatorsWithOptions.map((v) => v.mutator);

    // if we have no mutators to apply, let's bail out.
    if (mutatorsWithOptions.length === 0) {
      if (newMutators.size > 0) {
        // we might need to clone this type later if something in our subgraph needs mutated.
        interstitialFunctions.push(initializeClone);
        visitSubgraph();
        interstitialFunctions.pop();
        return clone ?? type;
      } else {
        // we don't need to clone this type, so let's just return it.
        return type;
      }
    }

    // step 2: see if we need to mutate based on the set of mutators we're actually going to run
    existing = seen.get([type, mutatorsToApply]);
    if (existing) {
      clearInterstitialFunctions();
      return existing as T;
    }

    // step 3: run the mutators
    clearInterstitialFunctions();
    initializeClone();

    for (const { mutationFn, replaceFn } of mutatorsWithOptions) {
      // todo: handle replace earlier in the mutation chain
      const result: MutableType = (mutationFn! ?? replaceFn!)(
        type,
        clone! as any,
        program,
        realm,
      ) as any;

      if (replaceFn && result !== undefined) {
        clone = result;
        seen.set([type, activeMutators], clone);
        seen.set([type, mutatorsToApply], clone);
      }
    }

    if (newMutators.size > 0) {
      visitSubgraph();
    }

    $(realm).type.finishType(clone!);

    return clone!;

    function initializeClone() {
      clone = $(realm).type.clone(type);
      seen.set([type, activeMutators], clone);
      seen.set([type, mutatorsToApply], clone);
    }

    function clearInterstitialFunctions() {
      for (const interstitial of interstitialFunctions) {
        interstitial();
      }

      interstitialFunctions.length = 0;
    }

    function visitSubgraph() {
      const root = clone ?? type;
      switch (root.kind) {
        case "Model":
          for (const prop of root.properties.values()) {
            const newProp = mutateSubgraphWorker(prop, newMutators);

            if (clone) {
              (clone as any).properties.set(prop.name, newProp);
            }
          }
          if (root.indexer) {
            const res = mutateSubgraphWorker(root.indexer.value as any, newMutators);
            if (clone) {
              (clone as any).indexer.value = res;
            }
          }
          break;
        case "ModelProperty":
          const newType = mutateSubgraphWorker(root.type as MutableType, newMutators);
          if (clone) {
            (clone as any).type = newType;
          }

          break;
        case "Operation":
          const newParams = mutateSubgraphWorker(root.parameters, newMutators);
          if (clone) {
            (clone as any).parameters = newParams;
          }

          break;
        case "Scalar":
          const newBaseScalar = root.baseScalar
            ? mutateSubgraphWorker(root.baseScalar, newMutators)
            : undefined;
          if (clone) {
            (clone as any).baseScalar = newBaseScalar;
          }
      }
    }
  }
}

// #endregion
