import {
  compilerAssert,
  getTypeName,
  ModelProperty,
  type DecoratorContext,
  type Model,
  type Program,
} from "@typespec/compiler";
import {
  unsafe_MutableType as MutableType,
  unsafe_Mutator as Mutator,
  unsafe_MutatorFlow as MutatorFlow,
  unsafe_MutatorReplaceFn as MutatorReplaceFn,
} from "@typespec/compiler/experimental";
import { OmitMetadataDecorator } from "../generated-defs/TypeSpec.Http.Private.js";
import { isMetadata } from "./metadata.js";
import { cachedMutateSubgraph, rename } from "./utils/mutator-utils.js";

function applyClone(target: Model, clone: Model): void {
  target.name = clone.name;
  target.baseModel = clone.baseModel;
  target.properties = clone.properties;
}

export const $omitMetadata: OmitMetadataDecorator = (
  ctx: DecoratorContext,
  target: Model,
  source: Model,
  nameTemplate: string,
) => {
  const mutator = createOmitMetadataMutator(ctx.program, nameTemplate);
  const mutated = cachedMutateSubgraph(ctx.program, mutator, source);
  compilerAssert(
    mutated.type.kind === "Model",
    `Mutator should have mutated to a Model, but got ${mutated.type.kind}`,
    ctx.decoratorTarget,
  );
  applyClone(target, mutated.type as Model);
  target.decorators = target.decorators.filter((d) => d.decorator !== $omitMetadata);
};

function createOmitMetadataMutator(program: Program, nameTemplate: string): Mutator {
  return createDeepMutator(nameTemplate, {
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

export const $stripMetadata: OmitMetadataDecorator = (
  ctx: DecoratorContext,
  target: Model,
  source: Model,
  nameTemplate: string,
) => {
  const mutator = createStripMetadataMutator(ctx.program, nameTemplate);
  const mutated = cachedMutateSubgraph(ctx.program, mutator, source);
  compilerAssert(
    mutated.type.kind === "Model",
    `Mutator should have mutated to a Model, but got ${mutated.type.kind}`,
    ctx.decoratorTarget,
  );
  applyClone(target, mutated.type);
  target.decorators = target.decorators.filter((d) => d.decorator !== $stripMetadata);
};

function createStripMetadataMutator(program: Program, nameTemplate: string): Mutator {
  return createDeepMutator(nameTemplate, {
    name: `StripMetadata`,
    ModelProperty(original, clone) {
      let mutated = false;
      const decorators = clone.decorators.filter((d) => {
        return (
          (d.definition?.name === "@query" ||
            d.definition?.name === "@header" ||
            d.definition?.name === "@path" ||
            d.definition?.name === "@cookie" ||
            d.definition?.name === "@statusCode") &&
          getTypeName(d.definition.namespace) === "Http"
        );
      });
      if (decorators.length !== clone.decorators.length) {
        mutated = true;
        clone.decorators = decorators;
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

function createDeepMutator(nameTemplate: string, mutator: DeepMutator) {
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
        let mutated = false;
        if (mutator.Model !== undefined) {
          const changed = mutator.Model(original, clone, program, realm);
          mutated = changed !== original;
          if (mutated) clone = changed as Model;
        }
        if (original.baseModel) {
          const baseClone = cachedMutateSubgraph(program, self, original.baseModel).type;
          if (baseClone !== original.baseModel) {
            clone.baseModel = baseClone as Model;
            mutated = true;
          }
        }
        for (const [name, prop] of original.properties.entries()) {
          const propClone = cachedMutateSubgraph(program, self, prop).type;
          if (propClone !== prop && propClone.kind === "ModelProperty") {
            mutated = true;
            clone.properties.set(name, propClone);
          }
        }
        if (mutated) rename(program, clone, nameTemplate);
        return mutated ? clone : original;
      },
    },
    ModelProperty: {
      replace(original, clone, program, realm) {
        let mutated = false;
        if (mutator.ModelProperty !== undefined) {
          const changed = mutator.ModelProperty(original, clone, program, realm);
          mutated = changed !== original;
          if (mutated) clone = changed as ModelProperty;
        }
        const typeClone = cachedMutateSubgraph(program, self, clone.type as any).type;
        if (typeClone !== clone.type) {
          clone.type = typeClone;
          mutated = true;
        }

        return mutated ? clone : original;
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
        if (mutated) rename(program, clone, nameTemplate);
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
        if (mutated) rename(program, clone, nameTemplate);

        return mutated ? clone : original;
      },
    },
    EnumMember: {
      replace(original: any, clone: any, program: Program) {
        // EnumMember does not need recursion
        if (clone.value) {
          const valueClone = cachedMutateSubgraph(program, self, clone.value).type;
          if (valueClone !== clone.value) {
            clone.value = valueClone;
            return clone;
          }
        }
        return original;
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
        if (mutated) rename(program, clone, nameTemplate);

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
        if (mutated) rename(program, clone, nameTemplate);
        return mutated ? clone : original;
      },
    },
  };

  return self;
}
