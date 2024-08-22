import { CustomKeyMap } from "../emitter-framework/custom-key-map.js";
import { $doc, isVisible } from "../lib/decorators.js";
import { Program } from "./program.js";
import { Realm } from "./realm.js";
import { isArrayModelType } from "./type-utils.js";
import {
  Decorator,
  DecoratorFunction,
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
  SyntaxKind,
  TemplateParameter,
  Tuple,
  Type,
  Union,
  UnionVariant,
} from "./types.js";

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

export interface MutatorFn<T extends Type> {
  (sourceType: T, clone: T, program: Program, realm: Realm): void;
}

export interface MutatorFilterFn<T extends Type> {
  (sourceType: T, program: Program, realm: Realm): boolean | MutatorFlow;
}

export interface MutatorReplaceFn<T extends Type> {
  (sourceType: T, clone: T, program: Program, realm: Realm): Type;
}

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

export interface VisibilityOptions {
  visibility: string;
}

export enum MutatorFlow {
  MutateAndRecurse = 0,
  DontMutate = 1 << 0,
  DontRecurse = 1 << 1,
}

export function createVisibilityMutator(visibility: string): Mutator {
  return {
    name: visibility + " Visibility",
    Model: {
      filter(m, program, realm) {
        if (isArrayModelType(program, m)) {
          return MutatorFlow.DontMutate;
        }
        return true;
      },
      mutate(m, clone, program, realm) {
        if (clone.name) {
          clone.name = m.name + visibility.charAt(0).toUpperCase() + visibility.slice(1);
        }

        for (const prop of m.properties.values()) {
          if (!isVisible(program, prop, [visibility])) {
            clone.properties.delete(prop.name);
            realm.remove(prop);
          }
        }
        return;
      },
    },
  };
}

const JSONMergePatch: Mutator = {
  name: "JSON Merge Patch",
  Model: {
    filter(m, program, realm) {
      // hissssss bad hissssss
      if (m.node!.parent!.kind === SyntaxKind.OperationSignatureDeclaration) {
        return MutatorFlow.DontMutate;
      }

      return isArrayModelType(program, m) ? MutatorFlow.DontRecurse | MutatorFlow.DontMutate : true;
    },
    mutate(sourceType, clone, program, realm) {
      if (clone.name) {
        clone.name = clone.name + "MergePatch";
      }

      for (const prop of clone.properties.values()) {
        const clonedProp = realm.typeFactory.initializeClone(prop);
        if (clonedProp.optional) {
          if (clonedProp.type.kind === "Scalar") {
            // remove everything but doc and apply it to the declaration
            // TODO: THIS IS A HACK
            const docDecorator = clonedProp.decorators.filter((d) => d.decorator === $doc);
            const otherDecorators: [DecoratorFunction, ...any][] = clonedProp.decorators
              .filter((d) => d.decorator !== $doc)
              .map((d) => {
                return [d.decorator, ...d.args.map((v) => v.jsValue)];
              });

            clonedProp.decorators = docDecorator;

            const ginnedScalar = realm.typeFactory.scalar(
              ...otherDecorators,
              clone.name + prop.name[0].toUpperCase() + prop.name.slice(1),
              {
                extends: clonedProp.type,
              }
            );

            clonedProp.type = realm.typeFactory.union([ginnedScalar, program.typeFactory.null]);
          } else {
            // otherwise pray it works, I guess
            clonedProp.type = realm.typeFactory.union([clonedProp.type, program.typeFactory.null]);
          }
        }
        clonedProp.optional = true;
        clone.properties.set(prop.name, clonedProp);
        realm.typeFactory.finishType(clonedProp);
      }
    },
  },
};

export const Mutators = {
  Visibility: {
    create: createVisibilityMutator("create"),
    read: createVisibilityMutator("read"),
    update: createVisibilityMutator("update"),
    delete: createVisibilityMutator("delete"),
    query: createVisibilityMutator("query"),
  },
  JSONMergePatch,
};

export type MutatableType = Exclude<
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
const seen = new CustomKeyMap<[MutatableType, Set<Mutator> | Mutator[]], Type>(
  ([type, mutators]) => {
    const key = `${typeId.getKey(type)}-${[...mutators.values()]
      .map((v) => mutatorId.getKey(v))
      .join("-")}`;
    return key;
  }
);
export function mutateSubgraph<T extends MutatableType>(
  program: Program,
  mutators: Mutator[],
  type: T
): { realm: Realm | null; type: MutatableType } {
  const realm = new Realm(program, "realm for mutation");
  const interstitials: (() => void)[] = [];

  const mutated = mutateSubgraphWorker(type, new Set(mutators));

  if (mutated === type) {
    return { realm: null, type };
  } else {
    return { realm, type: mutated };
  }

  function mutateSubgraphWorker<T extends MutatableType>(
    type: T,
    activeMutators: Set<Mutator>
  ): MutatableType {
    let existing = seen.get([type, activeMutators]);
    if (existing) {
      cloneInterstitials();
      return existing as T;
    }

    let clone: MutatableType | null = null;
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
            mutate = (filterResult & MutatorFlow.DontMutate) === 0;
            recurse = (filterResult & MutatorFlow.DontRecurse) === 0;
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
        interstitials.push(initializeClone);
        visitSubgraph();
        interstitials.pop();
        return clone ?? type;
      } else {
        // we don't need to clone this type, so let's just return it.
        return type;
      }
    }

    // step 2: see if we need to mutate based on the set of mutators we're actually going to run
    existing = seen.get([type, mutatorsToApply]);
    if (existing) {
      cloneInterstitials();
      return existing as T;
    }

    // step 3: run the mutators
    cloneInterstitials();
    initializeClone();

    for (const { mutationFn, replaceFn } of mutatorsWithOptions) {
      // todo: handle replace earlier in the mutation chain
      const result: MutatableType = (mutationFn! ?? replaceFn!)(
        type,
        clone! as any,
        program,
        realm
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

    realm.typeFactory.finishType(clone!);

    return clone!;

    function initializeClone() {
      clone = realm.typeFactory.initializeClone(type);
      seen.set([type, activeMutators], clone);
      seen.set([type, mutatorsToApply], clone);
    }

    function cloneInterstitials() {
      for (const interstitial of interstitials) {
        interstitial();
      }

      interstitials.length = 0;
    }

    function visitSubgraph<T extends MutatableType>() {
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
          const newType = mutateSubgraphWorker(root.type as MutatableType, newMutators);
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
