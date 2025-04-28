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
  isArrayModelType,
  isVisible,
  Model,
  ModelProperty,
  navigateType,
  Program,
  resetVisibilityModifiersForClass,
  Type,
  Union,
  UnionVariant,
  Value,
  VisibilityFilter,
} from "@typespec/compiler";

import {
  unsafe_$ as $,
  unsafe_isMutableType as isMutableType,
  unsafe_mutateSubgraph as mutateSubgraph,
  unsafe_Mutator as Mutator,
  unsafe_MutatorFlow as MutatorFlow,
  unsafe_Realm as Realm,
} from "@typespec/compiler/experimental";

import {
  ApplyMergePatchDecorator,
  ApplyMergePatchOptions,
  MergePatchModelDecorator,
} from "../generated-defs/TypeSpec.Http.Private.js";
import { HttpStateKeys, reportDiagnostic } from "./lib.js";

export const $mergePatchModel: MergePatchModelDecorator = (
  ctx: DecoratorContext,
  target: Model,
) => {
  ctx.program.stateMap(HttpStateKeys.mergePatchModel).set(target, true);
};
export const $applyMergePatch: ApplyMergePatchDecorator = (
  ctx: DecoratorContext,
  target: Model,
  source: Model,
  nameTemplate: string,
  options: ApplyMergePatchOptions,
) => {
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
  ctx.program.stateMap(HttpStateKeys.mergePatchModel).set(target, true);
};

/**
 * Determines if the given model is part of a mergePatch transform
 * @param program The compiled TypeSpec program
 * @param model The model to check
 * @returns true if the model was generated using a mergePatch template, otherwise false
 */
export function isMergePatch(program: Program, model: Model): boolean {
  return program.stateMap(HttpStateKeys.mergePatchModel).has(model);
}

/** The characteristics of the property as part of a mergePatch request body */
export interface MergePatchProperties {
  /** Can the property accept null */
  erasable: boolean;
  /** How does the property update the corresponding resource property */
  updateBehavior: "merge" | "replace";
  /** If this property is null, what will the corresponding value of the resource be set to (undefined if the resource property has no default) */
  erasedValue?: Value;
  /** The sourceProperty of this property */
  sourceProperty?: ModelProperty;
}

/**
 * Returns the MergePatch characteristics of the property, if the property is used in a MergePatch request
 * @param program The compiled TypeSpec program
 * @param property The model property to check
 * @returns The characteristics of the property in a MergePatch request (or undefined if the property is not part of a mErgePatch request)
 */
export function getMergePatchProperties(
  program: Program,
  property: ModelProperty,
): MergePatchProperties | undefined {
  function getUpdateBehavior(type: Type): "merge" | "replace" {
    switch (type.kind) {
      case "Model":
        if (isArrayModelType(program, type)) return "merge";
        return "replace";
      default:
        return "replace";
    }
  }
  if (!property.model || !isMergePatch(program, property.model)) return undefined;
  return {
    erasable: property.optional || property.defaultValue !== undefined,
    updateBehavior: getUpdateBehavior(property.type),
    sourceProperty: property.sourceProperty,
    erasedValue: property.defaultValue,
  };
}

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

  const [primaryFilter, optionalFilter, arrayFilter] = visibilityModeToFilters(
    ctx.program,
    visibilityMode,
  );

  const arrayMutator = bindMutator(arrayFilter);
  const optionalMutator = bindMutator(optionalFilter, arrayMutator);

  return bindMutator(primaryFilter, arrayMutator, optionalMutator);

  // const mpMutatorPrimary: Mutator = {
  //   name: "MergePatchProperty",
  //   ModelProperty: {
  //     filter: () => MutatorFlow.DoNotRecur,
  //     mutate: (prop, clone, program) => {
  //       const decorators: DecoratorApplication[] = [];

  //       for (const decorator of prop.decorators) {
  //         const decFn = decorator.decorator;
  //         if (decFn === $visibility || decFn === $removeVisibility) {
  //           const nextArgs = decorator.args.filter((arg) => {
  //             if (arg.value.entityKind !== "Value") return false;

  //             const isOperativeVisibility =
  //               arg.value.valueKind === "EnumValue" && arg.value.value.enum === Lifecycle;

  //             return !isOperativeVisibility;
  //           });

  //           if (nextArgs.length > 0) {
  //             decorators.push({
  //               ...decorator,
  //               args: nextArgs,
  //             });
  //           }
  //         } else if (!(decFn === $invisible && decorator.args[0]?.value === Lifecycle)) {
  //           decorators.push(decorator);
  //         }
  //       }

  //       clone.decorators = decorators;

  //       resetVisibilityModifiersForClass(program, clone, Lifecycle);

  //       if (prop.type.kind === "Model") {
  //         const mutated = clone.optional
  //           ? mutateSubgraph(program, [innerMutator], prop)
  //           : mutateSubgraph(program, [primaryMutator], prop);
  //         clone.type = mutated.type;
  //       }
  //     },
  //   },
  // };

  // const mpMutatorInner: Mutator = {
  //   name: "MergePatchProperty",
  //   ModelProperty: {
  //     filter: () => MutatorFlow.DoNotRecur,
  //     mutate: (prop, clone, program) => {
  //       const decorators: DecoratorApplication[] = [];

  //       for (const decorator of prop.decorators) {
  //         const decFn = decorator.decorator;
  //         if (decFn === $visibility || decFn === $removeVisibility) {
  //           const nextArgs = decorator.args.filter((arg) => {
  //             if (arg.value.entityKind !== "Value") return false;

  //             const isString = arg.value.valueKind === "StringValue";
  //             const isOperativeVisibility =
  //               arg.value.valueKind === "EnumValue" && arg.value.value.enum === Lifecycle;

  //             return !(isString || isOperativeVisibility);
  //           });

  //           if (nextArgs.length > 0) {
  //             decorators.push({
  //               ...decorator,
  //               args: nextArgs,
  //             });
  //           }
  //         } else if (!(decFn === $invisible && decorator.args[0]?.value === Lifecycle)) {
  //           decorators.push(decorator);
  //         }
  //       }

  //       clone.decorators = decorators;

  //       resetVisibilityModifiersForClass(program, clone, Lifecycle);

  //       if (prop.type.kind === "Model") {
  //         const mutated = prop.optional
  //           ? mutateSubgraph(program, [innerMutator], prop.type)
  //           : mutateSubgraph(program, [primaryMutator], prop.type);
  //         clone.type = mutated.type;
  //       }
  //     },
  //   },
  // };

  // const primaryMutator: Mutator = {
  //   name: "VisibilityFilter",
  //   Union: {
  //     filter: () => MutatorFlow.DoNotRecur,
  //     mutate: (union, clone, program) => {
  //       for (const [key, member] of union.variants) {
  //         if (member.type.kind === "Model" || member.type.kind === "Union") {
  //           const variant: UnionVariant = {
  //             ...member,
  //             type: mutateSubgraph(program, [primaryMutator], member.type).type,
  //           };
  //           clone.variants.set(key, variant);
  //         }
  //       }
  //     },
  //   },
  //   Model: {
  //     filter: () => MutatorFlow.DoNotRecur,
  //     mutate: (model, clone, program, realm) => {
  //       for (const [key, prop] of model.properties) {
  //         if (!isVisible(program, prop, primaryFilter)) {
  //           // Property is not visible, remove it
  //           clone.properties.delete(key);
  //           realm.remove(clone);
  //         } else {
  //           const mutated = mutateSubgraph(program, [mpMutatorPrimary], prop);

  //           clone.properties.set(key, mutated.type as ModelProperty);
  //         }
  //       }

  //       clone.decorators = clone.decorators.filter((d) => d.decorator !== $applyMergePatch);
  //     },
  //   },
  //   ModelProperty: {
  //     filter: () => MutatorFlow.DoNotRecur,
  //     mutate: (prop, clone, program) => {
  //       if (prop.type.kind === "Model") {
  //         clone.type = mutateSubgraph(program, [primaryMutator], prop.type).type;
  //       }
  //     },
  //   },
  //   Tuple: {
  //     filter: () => MutatorFlow.DoNotRecur,
  //     mutate: (tuple, clone, program) => {
  //       for (const [index, element] of tuple.values.entries()) {
  //         if (element.kind === "Model") {
  //           clone.values[index] = mutateSubgraph(program, [self], element).type;
  //         }
  //       }
  //     },
  //   },
  // };

  // const innerMutator: Mutator = {
  //   name: "VisibilityFilter",
  //   Union: {
  //     filter: () => MutatorFlow.DoNotRecur,
  //     mutate: (union, clone, program) => {
  //       for (const [key, member] of union.variants) {
  //         if (member.type.kind === "Model" || member.type.kind === "Union") {
  //           const variant: UnionVariant = {
  //             ...member,
  //             type: mutateSubgraph(program, [self], member.type).type,
  //           };
  //           clone.variants.set(key, variant);
  //         }
  //       }
  //     },
  //   },
  //   Model: {
  //     filter: () => MutatorFlow.DoNotRecur,
  //     mutate: (model, clone, program, realm) => {
  //       for (const [key, prop] of model.properties) {
  //         if (!isVisible(program, prop, innerFilter)) {
  //           // Property is not visible, remove it
  //           clone.properties.delete(key);
  //           realm.remove(clone);
  //         } else {
  //           const mutated = mutateSubgraph(program, [mpMutatorInner], prop);

  //           clone.properties.set(key, mutated.type as ModelProperty);
  //         }
  //       }

  //       clone.decorators = clone.decorators.filter((d) => d.decorator !== $applyMergePatch);
  //     },
  //   },
  //   ModelProperty: {
  //     filter: () => MutatorFlow.DoNotRecur,
  //     mutate: (prop, clone, program) => {
  //       if (prop.type.kind === "Model") {
  //         clone.type = mutateSubgraph(program, [innerMutator], prop.type).type;
  //       }
  //     },
  //   },
  //   Tuple: {
  //     filter: () => MutatorFlow.DoNotRecur,
  //     mutate: (tuple, clone, program) => {
  //       for (const [index, element] of tuple.values.entries()) {
  //         if (isMutableType(element)) {
  //           clone.values[index] = mutateSubgraph(program, [innerMutator], element).type;
  //         }
  //       }
  //     },
  //   },
  // };

  // return primaryMutator;

  function bindMutator(
    visibilityFilter: VisibilityFilter,
    _arrayInteriorMutator?: Mutator,
    _optionalInteriorMutator?: Mutator,
  ): Mutator {
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

          clone.optional = true;

          if (isMutableType(prop.type)) {
            const mutated = clone.optional
              ? // Optional property --> Transition to interior mutator
                mutateSubgraph(program, [_optionalInteriorMutator ?? self], prop)
              : // Required property --> Recur on this mutator.
                mutateSubgraph(program, [self], prop);

            clone.type = mutated.type;
          }

          // If the property is _effectively_ optional, we need to make this nullable.
          const isEffectivelyOptional = prop.optional || prop.defaultValue !== undefined;

          if (isEffectivelyOptional) clone.type = nullable(realm, clone.type);
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
              value: mutateSubgraph(program, [_arrayInteriorMutator ?? self], model.indexer!.value)
                .type,
            };
          } else if ($(realm).record.is(model) && isMutableType(model.indexer!.value)) {
            clone.indexer = {
              key: model.indexer!.key,
              value: mutateSubgraph(program, [self], model.indexer!.value).type,
            };
          }

          for (const [key, prop] of model.properties) {
            if (!isVisible(program, prop, visibilityFilter)) {
              // Property is not visible, remove it
              clone.properties.delete(key);
              realm.remove(clone);
            } else {
              const mutated = mutateSubgraph(program, [mpMutator], prop);

              clone.properties.set(key, mutated.type as ModelProperty);
            }
          }

          clone.decorators = clone.decorators.filter((d) => d.decorator !== $applyMergePatch);
          ctx.call($mergePatchModel, clone);
          ctx.call($friendlyName, clone, nameTemplate, clone);
        },
      },
      ModelProperty: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (prop, clone, program) => {
          if (isMutableType(prop.type)) {
            clone.type = mutateSubgraph(program, [self], prop.type).type;
          }
        },
      },
      UnionVariant: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (variant, clone, program) => {
          if (isMutableType(variant.type)) {
            const mutated = mutateSubgraph(program, [self], variant.type);
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
          type: realm.program.checker.nullType,
        }),
      ],
    });
  }
}
