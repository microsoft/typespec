import {
  $friendlyName,
  $invisible,
  $removeVisibility,
  $visibility,
  compilerAssert,
  DecoratorApplication,
  DecoratorContext,
  EnumValue,
  getLifecycleVisibilityEnum,
  isVisible,
  Model,
  ModelProperty,
  navigateType,
  Program,
  resetVisibilityModifiersForClass,
  Type,
  Union,
  UnionVariant,
  VisibilityFilter,
} from "@typespec/compiler";

import {
  unsafe_isMutableType as isMutableType,
  unsafe_mutateSubgraph as mutateSubgraph,
  unsafe_Mutator as Mutator,
  unsafe_MutatorFlow as MutatorFlow,
  unsafe_Realm as Realm,
} from "@typespec/compiler/experimental";
import { $ } from "@typespec/compiler/typekit";

import {
  ApplyMergePatchDecorator,
  ApplyMergePatchOptions,
  MergePatchModelDecorator,
  MergePatchPropertyDecorator,
} from "../generated-defs/TypeSpec.Http.Private.js";
import {
  setMergePatchPropertySource,
  setMergePatchSource,
} from "./experimental/merge-patch/index.js";
import { HttpStateKeys, reportDiagnostic } from "./lib.js";
import { isMetadata } from "./metadata.js";

export const $mergePatchModel: MergePatchModelDecorator = (
  ctx: DecoratorContext,
  target: Model,
  source: Model,
) => {
  setMergePatchSource(ctx.program, target, source);
};

export const $mergePatchProperty: MergePatchPropertyDecorator = (
  ctx: DecoratorContext,
  target: ModelProperty,
  source: ModelProperty,
) => {
  setMergePatchPropertySource(ctx.program, target, source);
};

export const $applyMergePatch: ApplyMergePatchDecorator = (
  ctx: DecoratorContext,
  target: Model,
  source: Model,
  nameTemplate: string,
  options: ApplyMergePatchOptions,
) => {
  setMergePatchSource(ctx.program, target, source);
  let reported = false;
  navigateType(
    source,
    {
      intrinsic: (i) => {
        if (!reported && i.name === "null") {
          reportDiagnostic(ctx.program, {
            code: "merge-patch-contains-null",
            target,
          });
          reported = true;
        }
      },
    },
    { visitDerivedTypes: false, includeTemplateDeclaration: false },
  );

  const mutated = mutateSubgraph(
    ctx.program,
    [createMergePatchMutator(ctx, nameTemplate, options)],
    source,
  );

  target.properties = (mutated.type as Model).properties;
  ctx.program.stateMap(HttpStateKeys.mergePatchModel).set(target, source);
};

function visibilityModeToFilters(
  program: Program,
  visibilityMode: "Update" | "CreateOrUpdate",
): [VisibilityFilter, VisibilityFilter, VisibilityFilter] {
  const Lifecycle = getLifecycleVisibilityEnum(program);

  const vfUpdate: VisibilityFilter = { any: new Set([Lifecycle.members.get("Update")!]) };
  const vfCreateOrUpdate: VisibilityFilter = {
    any: new Set([Lifecycle.members.get("Create")!, Lifecycle.members.get("Update")!]),
  };
  const vfCreate: VisibilityFilter = { any: new Set([Lifecycle.members.get("Create")!]) };

  switch (visibilityMode) {
    case "Update":
      return [vfUpdate, vfCreateOrUpdate, vfCreate] as const;
    case "CreateOrUpdate":
      return [vfCreateOrUpdate, vfCreateOrUpdate, vfCreate] as const;
    default:
      void (visibilityMode satisfies "never");
      compilerAssert(false, `Unexpected MergePatch visibility mode: ${visibilityMode}`);
  }
}

/**
 * Create a mutator that applies a visibility filter to a type.
 *
 * @param filter - The visibility filter to apply
 * @param options - optional settings for the mutator
 * @returns
 */
function createMergePatchMutator(
  ctx: DecoratorContext,
  nameTemplate: string,
  options: ApplyMergePatchOptions,
): Mutator {
  const Lifecycle = getLifecycleVisibilityEnum(ctx.program);
  const visibilityMode = (options.visibilityMode as EnumValue).value.name as
    | "Update"
    | "CreateOrUpdate";

  const [primaryFilter, optionalFilter, replaceFilter] = visibilityModeToFilters(
    ctx.program,
    visibilityMode,
  );

  const replaceMutator = bindMutator(replaceFilter);
  const optionalMutator = bindMutator(optionalFilter, replaceMutator);

  return bindMutator(primaryFilter, replaceMutator, optionalMutator);

  function bindMutator(
    visibilityFilter: VisibilityFilter,
    _replaceInteriorMutator?: Mutator,
    _optionalInteriorMutator?: Mutator,
  ): Mutator {
    function isReplaceMutator(): boolean {
      return _replaceInteriorMutator === undefined;
    }
    const mpMutator: Mutator = {
      name: `MergePatchProperty${visibilityMode}`,
      ModelProperty: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (prop, clone, program, realm) => {
          const decorators: DecoratorApplication[] = [];

          for (const decorator of prop.decorators) {
            const decFn = decorator.decorator;
            if (decFn === $visibility || decFn === $removeVisibility) {
              const nextArgs = decorator.args.filter((arg) => {
                if (arg.value.entityKind !== "Value") return false;

                const isOperativeVisibility =
                  arg.value.valueKind === "EnumValue" && arg.value.value.enum === Lifecycle;

                return !isOperativeVisibility;
              });

              if (nextArgs.length > 0) {
                decorators.push({
                  ...decorator,
                  args: nextArgs,
                });
              }
            } else if (!(decFn === $invisible && decorator.args[0]?.value === Lifecycle)) {
              decorators.push(decorator);
            }
          }

          clone.decorators = decorators;
          resetVisibilityModifiersForClass(program, clone, Lifecycle);
          clone.optional = isReplaceMutator() ? prop.optional : true;
          clone.defaultValue = isReplaceMutator() ? prop.defaultValue : undefined;

          if (isMutableType(prop.type)) {
            const mutated = prop.optional
              ? // Optional property --> Transition to interior mutator
                mutateSubgraph(program, [_optionalInteriorMutator ?? self], prop.type)
              : // Required property --> Recur on this mutator.
                mutateSubgraph(program, [self], prop.type);

            clone.type = mutated.type;
          }

          // If the property is _effectively_ optional, we need to make this nullable.
          const isEffectivelyOptional =
            !isReplaceMutator() && (prop.optional || prop.defaultValue !== undefined);

          if (isEffectivelyOptional) clone.type = nullable(realm, clone.type);
          ctx.program.stateMap(HttpStateKeys.mergePatchProperty).set(clone, prop);
        },
      },
    };

    const self: Mutator = {
      name: `MergePatch${visibilityMode}`,
      Union: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (union, clone, program) => {
          for (const [key, member] of union.variants) {
            if (isMutableType(member.type)) {
              const variant: UnionVariant = {
                ...member,
                type: mutateSubgraph(program, [self], member.type).type,
              };
              clone.variants.set(key, variant);
            }
          }
        },
      },
      Model: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (model, clone, program, realm) => {
          if ($(realm).array.is(model) && isMutableType(model.indexer!.value)) {
            clone.indexer = {
              key: model.indexer!.key,
              value: mutateSubgraph(
                program,
                [_replaceInteriorMutator ?? self],
                model.indexer!.value,
              ).type,
            };
          } else if ($(realm).record.is(model) && isMutableType(model.indexer!.value)) {
            clone.indexer = {
              key: model.indexer!.key,
              value: mutateSubgraph(
                program,
                [_optionalInteriorMutator ?? self], // records are always CreateOrUpdate
                model.indexer!.value,
              ).type,
            };
          }

          for (const [key, prop] of model.properties) {
            if (!isVisible(program, prop, visibilityFilter)) {
              // Property is not visible, remove it
              clone.properties.delete(key);
              realm.remove(clone);
            } else if (!isMetadata(program, prop)) {
              const mutated = mutateSubgraph(program, [mpMutator], prop);
              const mutatedProp = mutated.type as ModelProperty;
              mutatedProp.model = clone;
              clone.properties.set(key, mutatedProp);
            }
          }

          clone.decorators = clone.decorators.filter((d) => d.decorator !== $applyMergePatch);
          ctx.program.stateMap(HttpStateKeys.mergePatchModel).set(clone, model);
          ctx.call($friendlyName, clone, nameTemplate, clone);
        },
      },
      ModelProperty: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (prop, clone, program) => {
          if (isMutableType(prop.type)) {
            clone.type = mutateSubgraph(
              program,
              [prop.optional ? (_optionalInteriorMutator ?? self) : self],
              prop.type,
            ).type;
          }
          ctx.program.stateMap(HttpStateKeys.mergePatchProperty).set(clone, prop);
        },
      },
      UnionVariant: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (variant, clone, program) => {
          if (isMutableType(variant.type)) {
            const mutated = mutateSubgraph(
              program,
              [_optionalInteriorMutator || self],
              variant.type,
            );
            clone.type = mutated.type;
          }
        },
      },
      Tuple: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (tuple, clone, program) => {
          for (const [index, element] of tuple.values.entries()) {
            if (isMutableType(element)) {
              clone.values[index] = mutateSubgraph(program, [self], element).type;
            }
          }
        },
      },
    };

    return self;
  }

  function nullable(realm: Realm, t: Type): Union {
    return $(realm).union.create({
      variants: [
        $(realm).unionVariant.create({
          type: t,
        }),
        $(realm).unionVariant.create({
          type: $(realm).intrinsic.null,
        }),
      ],
    });
  }
}
