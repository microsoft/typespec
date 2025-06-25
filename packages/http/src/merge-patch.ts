import {
  $invisible,
  $removeVisibility,
  $visibility,
  compilerAssert,
  DecoratorApplication,
  DecoratorContext,
  EnumValue,
  getDiscriminatedUnion,
  getDiscriminator,
  getLifecycleVisibilityEnum,
  isVisible,
  Model,
  ModelProperty,
  navigateType,
  Program,
  resetVisibilityModifiersForClass,
  Tuple,
  Type,
  Union,
  UnionVariant,
  VisibilityFilter,
} from "@typespec/compiler";

import {
  unsafe_MutableType as MutableType,
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
import { isCookieParam, isHeader, isPathParam, isQueryParam, isStatusCode } from "./decorators.js";
import {
  getMergePatchPropertyOverrides,
  MergePatchPropertyOverrides,
  setMergePatchPropertyOverrides,
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

const MUTATOR_RESULT_CACHE = Symbol.for("TypeSpec.Http.MutatorResultCache");

interface MutatorResultCache {
  [MUTATOR_RESULT_CACHE]?: WeakMap<MutableType, ReturnType<typeof mutateSubgraph>>;
}

function cachedMutateSubgraph(
  program: Program,
  mutator: Mutator,
  type: MutableType,
): ReturnType<typeof mutateSubgraph> {
  const cache = ((mutator as MutatorResultCache)[MUTATOR_RESULT_CACHE] ??= new WeakMap());

  let cached = cache.get(type);

  if (cached) return cached;

  cached = mutateSubgraph(program, [mutator], type);

  cache.set(type, cached);
  return cached;
}

const MERGE_PATCH_MUTATOR_CACHE = Symbol.for("TypeSpec.Http.MergePatchMutatorCache");

interface MergePatchMutatorCache {
  [MERGE_PATCH_MUTATOR_CACHE]?: {
    [nameTemplate: string]: Partial<Record<MergePatchVisibilityMode, Mutator>>;
  };
}

type MergePatchVisibilityMode = "Update" | "CreateOrUpdate";

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

  const mutatorCache = ((ctx.program as MergePatchMutatorCache)[MERGE_PATCH_MUTATOR_CACHE] ??= {});

  const visibilityMode = (options.visibilityMode as EnumValue).value
    .name as MergePatchVisibilityMode;

  const mutator = ((mutatorCache[nameTemplate] ??= {})[visibilityMode] ??= createMergePatchMutator(
    ctx,
    nameTemplate,
    visibilityMode,
  ));

  const mutated = cachedMutateSubgraph(ctx.program, mutator, source);

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

function isDiscriminatedProperty(program: Program, property: ModelProperty): boolean {
  if (property.model === undefined) return false;
  const discriminator = getDiscriminator(program, property.model);
  if (discriminator === undefined) return false;
  if (discriminator.propertyName !== property.name) return false;
  return true;
}

function overrideDiscriminatedUnionProperty(program: Program, variant: UnionVariant) {
  const [discriminated, _] = getDiscriminatedUnion(program, variant.union);
  if (!discriminated || variant.type.kind !== "Model") return;
  for (const [name, property] of variant.type.properties) {
    if (name === discriminated.options.discriminatorPropertyName) {
      setPropertyOverride(program, property, { optional: false, erasable: false });
    }
  }
}

function setPropertyOverride(
  program: Program,
  property: ModelProperty,
  values: MergePatchPropertyOverrides,
): void {
  const override = getMergePatchPropertyOverrides(program, property) ?? {};
  if (values.optional !== undefined) override.optional = values.optional;
  if (values.erasable !== undefined) override.erasable = values.erasable;
  if (values.updateBehavior !== undefined) override.updateBehavior = values.updateBehavior;
  setMergePatchPropertyOverrides(program, property, override);
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
  visibilityMode: MergePatchVisibilityMode,
): Mutator {
  const Lifecycle = getLifecycleVisibilityEnum(ctx.program);

  const [primaryFilter, optionalFilter, replaceFilter] = visibilityModeToFilters(
    ctx.program,
    visibilityMode,
  );

  const replaceNameTemplate = nameTemplate + "ReplaceOnly";
  const optionalNameTemplate =
    visibilityMode === "CreateOrUpdate" ? nameTemplate : nameTemplate + "OrCreate";

  const replaceMutator = bindMutator(replaceFilter, replaceNameTemplate);
  const optionalMutator = bindMutator(optionalFilter, optionalNameTemplate, replaceMutator);

  if (visibilityMode === "CreateOrUpdate") {
    return optionalMutator;
  } else {
    return bindMutator(primaryFilter, nameTemplate, replaceMutator, optionalMutator);
  }

  function bindMutator(
    visibilityFilter: VisibilityFilter,
    nameTemplate: string,
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
          const overrides = getMergePatchPropertyOverrides(program, prop);
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

          if (isMergePatchSubject(prop.type)) {
            const mutated = prop.optional
              ? // Optional property --> Transition to interior mutator
                cachedMutateSubgraph(program, _optionalInteriorMutator ?? self, prop.type)
              : // Required property --> Recur on this mutator.
                cachedMutateSubgraph(program, self, prop.type);

            clone.type = mutated.type;
          }

          if (!isReplaceMutator()) {
            // perform the mergePatch transform of the ModelProperty
            if (
              overrides?.erasable !== false &&
              (prop.optional || prop.defaultValue !== undefined)
            ) {
              clone.type = nullable(realm, clone.type);
            }
            clone.optional =
              overrides?.optional ?? (isDiscriminatedProperty(program, prop) ? false : true);
            clone.defaultValue = undefined;
          }

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
            overrideDiscriminatedUnionProperty(program, member);
            if (isMergePatchSubject(member.type)) {
              const variant: UnionVariant = {
                ...member,
                type: cachedMutateSubgraph(program, _optionalInteriorMutator ?? self, member.type)
                  .type,
              };
              clone.variants.set(key, variant);
            }
          }

          rename(ctx.program, clone, nameTemplate);
        },
      },
      Model: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (model, clone, program, realm) => {
          if ($(realm).array.is(model) && isMergePatchSubject(model.indexer!.value)) {
            clone.indexer = {
              key: model.indexer!.key,
              value: cachedMutateSubgraph(
                program,
                _replaceInteriorMutator ?? self,
                model.indexer!.value,
              ).type,
            };
          } else if ($(realm).record.is(model) && isMergePatchSubject(model.indexer!.value)) {
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
              const clonedProp = clone.properties.get(key);
              if (clonedProp) {
                clone.properties.delete(key);
                realm.remove(clonedProp);
              }
            } else if (!isMetadata(program, prop)) {
              const mutated = mutateSubgraph(program, [mpMutator], prop);
              const mutatedProp = mutated.type as ModelProperty;
              mutatedProp.model = clone;
              clone.properties.set(key, mutatedProp);
            } else {
              const decorator: string | undefined = isPathParam(program, prop)
                ? "@path"
                : isHeader(program, prop)
                  ? "@header"
                  : isCookieParam(program, prop)
                    ? "@cookie"
                    : isQueryParam(program, prop)
                      ? "@query"
                      : isStatusCode(program, prop)
                        ? "@statusCode"
                        : undefined;
              if (decorator) {
                reportDiagnostic(program, {
                  code: "merge-patch-contains-metadata",
                  target: prop,
                  format: { metadataType: decorator, propertyName: prop.name },
                });
              }
            }
          }

          clone.decorators = clone.decorators.filter((d) => d.decorator !== $applyMergePatch);
          ctx.program.stateMap(HttpStateKeys.mergePatchModel).set(clone, model);
          rename(ctx.program, clone, nameTemplate);
        },
      },
      ModelProperty: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (prop, clone, program) => {
          if (isMergePatchSubject(prop.type)) {
            clone.type = cachedMutateSubgraph(
              program,
              prop.optional ? (_optionalInteriorMutator ?? self) : self,
              prop.type,
            ).type;
          }
          ctx.program.stateMap(HttpStateKeys.mergePatchProperty).set(clone, prop);
        },
      },
      UnionVariant: {
        filter: () => MutatorFlow.DoNotRecur,
        mutate: (variant, clone, program) => {
          if (isMergePatchSubject(variant.type)) {
            const mutated = cachedMutateSubgraph(
              program,
              _optionalInteriorMutator || self,
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
            if (isMergePatchSubject(element)) {
              clone.values[index] = cachedMutateSubgraph(
                program,
                _replaceInteriorMutator ?? self,
                element,
              ).type;
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

type MergePatchSubject = Model | Union | ModelProperty | UnionVariant | Tuple;

function isMergePatchSubject(type: Type): type is MergePatchSubject {
  return (
    type.kind === "Model" ||
    type.kind === "Union" ||
    type.kind === "ModelProperty" ||
    type.kind === "UnionVariant" ||
    type.kind === "Tuple"
  );
}

function rename(
  program: Program,
  type: Extract<MergePatchSubject, { name?: string }>,
  nameTemplate: string,
) {
  if ($(program).array.is(type) && type.name === "Array") return;
  if (type.name && nameTemplate) {
    type.name = replaceTemplatedStringFromProperties(nameTemplate, type);
  }
}

function replaceTemplatedStringFromProperties(formatString: string, sourceObject: Type) {
  // Template parameters are not valid source objects, just skip them
  if (sourceObject.kind === "TemplateParameter") {
    return formatString;
  }

  return formatString.replace(/{(\w+)}/g, (_, propName) => {
    return (sourceObject as any)[propName];
  });
}
