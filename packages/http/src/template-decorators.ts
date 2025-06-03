import type { DecoratorContext, Model, Program } from "@typespec/compiler";
import {
  unsafe_MutableType as MutableType,
  unsafe_Mutator as Mutator,
  unsafe_MutatorFlow as MutatorFlow,
} from "@typespec/compiler/experimental";
import { MutatorReplaceFn } from "../../compiler/src/experimental/mutators.js";
import { OmitMetadataDecorator } from "../generated-defs/TypeSpec.Http.Private.js";
import { isMetadata } from "./metadata.js";
import { cachedMutateSubgraph } from "./utils/cached-mutator.js";

const OMIT_METADATA_CACHE = Symbol.for("TypeSpec.Http.OmitMetadata");

export const $omitMetadata: OmitMetadataDecorator = (
  ctx: DecoratorContext,
  target: Model,
  source: Model,
) => {
  const mutatorCache = ((ctx.program as any)[OMIT_METADATA_CACHE] ??= {});

  const mutator = createOmitMetadataMutator(ctx.program);

  const mutated = cachedMutateSubgraph(ctx.program, mutator, source);

  target.properties = (mutated.type as Model).properties;
};

function createOmitMetadataMutator(program: Program, nameTemplate: string = ""): Mutator {
  return createDeepMutator({
    name: `OmitMetadata`,
    Model(original, clone) {
      let mutated = false;
      for (const prop of clone.properties.values()) {
        if (isMetadata(program, prop)) {
          mutated = true;
          clone.properties.delete(prop.name);
        }
      }
      return mutated ? clone : original;
    },
  });
}

type DeepMutator = {
  /**
   * The name of this mutator.
   */
  name: string;
} & {
  /**
   * Describes how to mutate a type with the given node kind.
   */
  [Kind in MutableType["kind"]]?: MutatorReplaceFn<Extract<MutableType, { kind: Kind }>>;
};

function createDeepMutator(mutator: DeepMutator) {
  const self: Mutator = {
    name: mutator.name,
    Tuple: {
      filter: () => MutatorFlow.DoNotRecur,
      replace: (original, clone, program) => {
        let mutated = false;
        for (const [index, element] of original.values.entries()) {
          const elementClone = cachedMutateSubgraph(program, self, element as any).type;
          if (elementClone !== element) {
            mutated = true;
            clone.values[index] = elementClone;
          }
        }
        return mutated ? clone : original;
      },
    },
    Model: {
      replace(original: Model, clone: Model, program: Program, realm) {
        const changed = mutator.Model?.(original, clone, program, realm);
        let mutated = changed !== original;
        clone = changed as Model;
        for (const [name, prop] of clone.properties.entries()) {
          const propClone = cachedMutateSubgraph(program, self, prop).type;
          if (propClone !== prop && propClone && propClone.kind === "ModelProperty") {
            mutated = true;
            clone.properties.set(name, propClone);
          }
        }
        return mutated ? clone : original;
      },
    },
    ModelProperty: {
      replace(original: any, clone: any, program: Program) {
        if (clone.type) {
          const typeClone = cachedMutateSubgraph(program, self, clone.type).type;
          if (typeClone !== clone.type) {
            clone.type = typeClone;
            return clone;
          }
        }
        return original;
      },
    },
    Union: {
      replace(original: any, clone: any, program: Program) {
        let mutated = false;
        for (const [name, variant] of clone.variants.entries()) {
          const variantClone = cachedMutateSubgraph(program, self, variant).type;
          if (variantClone !== variant && variantClone && variantClone.kind === "UnionVariant") {
            mutated = true;
            clone.variants.set(name, variantClone);
          }
        }
        return mutated ? clone : original;
      },
    },
    UnionVariant: {
      replace(original: any, clone: any, program: Program) {
        if (clone.type) {
          const typeClone = cachedMutateSubgraph(program, self, clone.type).type;
          if (typeClone !== clone.type) {
            clone.type = typeClone;
            return clone;
          }
        }
        return original;
      },
    },
    Enum: {
      replace(original: any, clone: any, program: Program) {
        let mutated = false;
        for (const [name, member] of clone.members.entries()) {
          const memberClone = cachedMutateSubgraph(program, self, member).type;
          if (memberClone !== member && memberClone && memberClone.kind === "EnumMember") {
            mutated = true;
            clone.members.set(name, memberClone);
          }
        }
        return mutated ? clone : original;
      },
    },
    // EnumMember and Scalar do not need recursion
    Interface: {
      replace(original: any, clone: any, program: Program) {
        let mutated = false;
        for (const [name, op] of clone.operations.entries()) {
          const opClone = cachedMutateSubgraph(program, self, op).type;
          if (opClone !== op && opClone && opClone.kind === "Operation") {
            mutated = true;
            clone.operations.set(name, opClone);
          }
        }
        return mutated ? clone : original;
      },
    },
    Operation: {
      replace(original: any, clone: any, program: Program) {
        let mutated = false;
        if (clone.parameters) {
          const paramsClone = cachedMutateSubgraph(program, self, clone.parameters).type;
          if (paramsClone !== clone.parameters && paramsClone && paramsClone.kind === "Model") {
            mutated = true;
            clone.parameters = paramsClone;
          }
        }
        if (clone.returnType) {
          const returnClone = cachedMutateSubgraph(program, self, clone.returnType).type;
          if (returnClone !== clone.returnType) {
            mutated = true;
            clone.returnType = returnClone;
          }
        }
        return mutated ? clone : original;
      },
    },
  };

  return self;
}
