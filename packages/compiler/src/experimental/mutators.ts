import { Program } from "../core/program.js";
import {
  Decorator,
  Enum,
  EnumMember,
  FunctionParameter,
  FunctionType,
  Interface,
  IntrinsicType,
  Model,
  ModelProperty,
  Namespace,
  ObjectType,
  Operation,
  Projection,
  Scalar,
  ScalarConstructor,
  StringTemplate,
  StringTemplateSpan,
  TemplateParameter,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "../core/types.js";
import { CustomKeyMap } from "../emitter-framework/custom-key-map.js";
import { Realm } from "./realm.js";
import { $ } from "./typekit/index.js";

/** @experimental */
export type MutatorRecord<T extends Type> =
  | {
      filter?: MutatorFilterFn<T>;
      mutate: MutatorFn<T>;
    }
  | {
      filter?: MutatorFilterFn<T>;
      replace: MutatorReplaceFn<T>;
    }
  | MutatorFn<T>;

/** @experimental */
export interface MutatorFn<T extends Type> {
  (sourceType: T, clone: T, program: Program, realm: Realm): void;
}

/** @experimental */
export interface MutatorFilterFn<T extends Type> {
  (sourceType: T, program: Program, realm: Realm): boolean | MutatorFlow;
}

/** @experimental */
export interface MutatorReplaceFn<T extends Type> {
  (sourceType: T, clone: T, program: Program, realm: Realm): Type;
}

/** @experimental */
export interface Mutator {
  name: string;
  Model?: MutatorRecord<Model>;
  ModelProperty?: MutatorRecord<ModelProperty>;
  Scalar?: MutatorRecord<Scalar>;
  Enum?: MutatorRecord<Enum>;
  EnumMember?: MutatorRecord<EnumMember>;
  Union?: MutatorRecord<Union>;
  UnionVariant?: MutatorRecord<UnionVariant>;
  Tuple?: MutatorRecord<Tuple>;
  Operation?: MutatorRecord<Operation>;
  Interface?: MutatorRecord<Interface>;
  String?: MutatorRecord<Scalar>;
  Number?: MutatorRecord<Scalar>;
  Boolean?: MutatorRecord<Scalar>;
  ScalarConstructor?: MutatorRecord<ScalarConstructor>;
  StringTemplate?: MutatorRecord<StringTemplate>;
  StringTemplateSpan?: MutatorRecord<StringTemplateSpan>;
}

/** @experimental */
export enum MutatorFlow {
  MutateAndRecurse = 0,
  DoNotMutate = 1 << 0,
  DoNotRecurse = 1 << 1,
}

/** @experimental */
export type MutableType = Exclude<
  Type,
  | TemplateParameter
  | Namespace
  | IntrinsicType
  | FunctionType
  | Decorator
  | FunctionParameter
  | ObjectType
  | Projection
>;
const typeId = CustomKeyMap.objectKeyer();
const mutatorId = CustomKeyMap.objectKeyer();
const seen = new CustomKeyMap<[MutableType, Set<Mutator> | Mutator[]], Type>(([type, mutators]) => {
  const key = `${typeId.getKey(type)}-${[...mutators.values()]
    .map((v) => mutatorId.getKey(v))
    .join("-")}`;
  return key;
});

/** @experimental */
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
            recurse = (filterResult & MutatorFlow.DoNotRecurse) === 0;
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

    $.type.finishType(clone!);

    return clone!;

    function initializeClone() {
      clone = $.type.clone(type);
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
