import { getLocationContext, TemplatedType } from "../core/index.js";
import { Program } from "../core/program.js";
import { getParentTemplateNode, isTemplateInstance, isType } from "../core/type-utils.js";
import {
  DecoratedType,
  Decorator,
  DecoratorArgument,
  FunctionParameter,
  FunctionType,
  IntrinsicType,
  Model,
  Namespace,
  ObjectType,
  Projection,
  TemplateParameter,
  Type,
  TypeMapper,
} from "../core/types.js";
import { CustomKeyMap } from "../emitter-framework/custom-key-map.js";
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
    forceClone = false,
  ): MutableType {
    let existing = seen.get([type, activeMutators]);
    if (existing) {
      clearInterstitialFunctions();
      return existing as T;
    }
    // TODO: mutating the compiler scalar cause lots of issues, but is this the right way to handle it?
    if (getLocationContext(program, type).type === "compiler" && !isTemplateInstance(type)) {
      return type;
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
    if (mutatorsWithOptions.length === 0 && !forceClone) {
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

    // Namespaces needs to be finished before we visit their content.
    if (type.kind === "Namespace") {
      visitDecorators(clone as any);
      $(realm).type.finishType(clone!);
    }

    if (newMutators.size > 0) {
      visitSubgraph();
    }

    function shouldFinishType(type: Type) {
      const parentTemplate = type.node && getParentTemplateNode(type.node);
      return !parentTemplate || isTemplateInstance(type);
    }

    if (type.kind !== "Namespace" && shouldFinishType(type!)) {
      $(realm).type.finishType(clone!);
    }

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

    function mutateSubMap<T extends MutableType, K extends keyof T>(
      type: T,
      prop: K,
      clone: any,
      callback: (value: any) => void,
    ) {
      for (const [key, value] of (type as any)[prop].entries()) {
        const newValue: any = mutateSubgraphWorker(value, newMutators, true);
        if (clone) {
          if (newValue !== value) {
            callback(newValue);
          }
          (clone as any)[prop].set(key, newValue);

          if (newValue.name !== value.name) {
            (clone as any)[prop].rekey(key, newValue.name);
          }
        }
      }
    }

    function mutateProperty<T extends MutableType, K extends keyof T>(
      original: T,
      prop: K,
      clone: any,
    ) {
      if (original[prop] === undefined) {
        return;
      }
      const newValue: any = mutateSubgraphWorker(original[prop] as any, newMutators);
      if (clone) {
        clone[prop] = newValue;
      }
    }

    function visitNamespace(root: Namespace) {
      const register = (value: any) => {
        // value.namespace = clone; // TODO: remove
      };
      mutateSubMap(root, "namespaces", clone, register);
      mutateSubMap(root, "models", clone, register);
      mutateSubMap(root, "operations", clone, register);
      mutateSubMap(root, "interfaces", clone, register);
      mutateSubMap(root, "enums", clone, register);
      mutateSubMap(root, "unions", clone, register);
      mutateSubMap(root, "scalars", clone, register);
    }

    function visitModel(root: Model) {
      mutateTemplateMapper(root);
      mutateSubMap(root, "properties", clone, (value) => (value.model = clone));
      if (root.indexer) {
        const res = mutateSubgraphWorker(root.indexer.value as any, newMutators);
        if (clone) {
          (clone as any).indexer.value = res;
        }
      }
      mutateProperty(root, "baseModel", clone);
      for (const [index, derivedModel] of root.derivedModels.entries()) {
        const newDerivedModel = mutateSubgraphWorker(derivedModel, newMutators);
        if (clone) {
          (clone as any).derivedModels[index] = newDerivedModel;
        }
      }
      visitDecorators(root);
    }

    function visitDecorators(root: MutableTypeWithNamespace & DecoratedType) {
      for (const [index, dec] of root.decorators.entries()) {
        const args: DecoratorArgument[] = [];
        for (const arg of dec.args) {
          const jsValue =
            typeof arg.jsValue === "object" &&
            isType(arg.jsValue as any) &&
            isMutableType(arg.jsValue as any)
              ? mutateSubgraphWorker(arg.jsValue as any, newMutators)
              : arg.jsValue;
          args.push({
            ...arg,
            value:
              isType(arg.value) && isMutableType(arg.value)
                ? mutateSubgraphWorker(arg.value, newMutators)
                : arg.value,
            jsValue,
          });
        }

        if (clone) {
          (clone as any).decorators[index] = { ...dec, args };
        }
      }
    }

    function visitSubgraph() {
      const root: MutableType | Namespace = clone ?? (type as MutableTypeWithNamespace);
      switch (root.kind) {
        case "Namespace":
          visitNamespace(root);
          break;
        case "Model":
          visitModel(root);
          break;
        case "ModelProperty":
          mutateProperty(root, "type", clone);
          mutateProperty(root, "sourceProperty", clone);
          mutateProperty(root, "model", clone);
          break;
        case "Operation":
          const newParams = mutateSubgraphWorker(root.parameters, newMutators);
          if (clone) {
            (clone as any).parameters = newParams;
          }

          mutateProperty(root, "returnType", clone);
          break;
        case "Interface":
          mutateSubMap(root, "operations", clone, (value) => (value.interface = clone));
          break;
        case "Enum":
          visitDecorators(root);
          mutateSubMap(root, "members", clone, (value) => null);
          break;
        case "EnumMember":
          visitDecorators(root);
          mutateProperty(root, "enum", clone);
          break;
        case "Union":
          mutateSubMap(root, "variants", clone, (value) => (value.union = clone));
          break;
        case "UnionVariant":
          mutateProperty(root, "type", clone);
          mutateProperty(root, "union", clone);
          break;
        case "Scalar":
          console.log("Muting", root.name, getLocationContext(program, type));
          mutateProperty(root, "baseScalar", clone);
          break;
      }
      mutateProperty(root as any, "namespace", clone);
    }

    function mutateTemplateMapper(root: TemplatedType) {
      if (root.templateMapper === undefined) {
        return;
      }
      const mutatedMapper: TypeMapper = {
        ...root.templateMapper,
        args: [],
        map: new Map(),
      };
      for (const arg of root.templateMapper.args) {
        mutate(mutatedMapper.args).push(mutateSubgraphWorker(arg as any, newMutators));
      }
      for (const [param, type] of root.templateMapper.map) {
        mutatedMapper.map.set(param, mutateSubgraphWorker(type as any, newMutators));
      }
      root.templateMapper = mutatedMapper;
    }
  }
}

// #endregion
