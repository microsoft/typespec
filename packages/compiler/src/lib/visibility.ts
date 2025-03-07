// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type {
  DefaultVisibilityDecorator,
  InvisibleDecorator,
  ParameterVisibilityDecorator,
  RemoveVisibilityDecorator,
  ReturnTypeVisibilityDecorator,
  VisibilityDecorator,
  WithDefaultKeyVisibilityDecorator,
  WithLifecycleUpdateDecorator,
  WithUpdateablePropertiesDecorator,
  WithVisibilityDecorator,
  WithVisibilityFilterDecorator,
} from "../../generated-defs/TypeSpec.js";
import { validateDecoratorTarget, validateDecoratorUniqueOnNode } from "../core/decorator-utils.js";
import { compilerAssert } from "../core/diagnostics.js";
import { reportDiagnostic } from "../core/messages.js";
import type { Program } from "../core/program.js";
import {
  DecoratorApplication,
  DecoratorContext,
  DecoratorFunction,
  Enum,
  EnumMember,
  EnumValue,
  Model,
  ModelProperty,
  Operation,
  Type,
  UnionVariant,
} from "../core/types.js";
import {
  addVisibilityModifiers,
  clearVisibilityModifiersForClass,
  GeneratedVisibilityFilter,
  getRawVisibilityStore,
  isVisible,
  removeVisibilityModifiers,
  resetVisibilityModifiersForClass,
  setDefaultModifierSetForVisibilityClass,
  VisibilityFilter,
} from "../core/visibility/core.js";
import { getLifecycleVisibilityEnum } from "../core/visibility/lifecycle.js";
import { isMutableType, mutateSubgraph, Mutator, MutatorFlow } from "../experimental/mutators.js";
import { useStateMap } from "../utils/index.js";
import { isKey } from "./key.js";
import { createStateSymbol, filterModelPropertiesInPlace } from "./utils.js";

export const $withDefaultKeyVisibility: WithDefaultKeyVisibilityDecorator = (
  context: DecoratorContext,
  entity: Model,
  visibility: EnumValue,
) => {
  const keyProperties = [...entity.properties].filter(([_, prop]: [string, ModelProperty]) => {
    // Keep track of any key property without a visibility
    return isKey(context.program, prop) && !getRawVisibilityStore(context.program, prop);
  });

  // For each key property without a visibility, clone it and add the specified
  // default visibility value
  for (const [name, keyProp] of keyProperties) {
    entity.properties.set(
      name,
      context.program.checker.cloneType(keyProp, {
        decorators: [
          ...keyProp.decorators,
          {
            decorator: $visibility,
            args: [
              {
                value: visibility,
                jsValue: visibility,
              },
            ],
          },
        ],
      }),
    );
  }
};

/**
 * Visibility configuration of an operation.
 */
interface OperationVisibilityConfig {
  /**
   * Stored parameter visibility configuration.
   */
  parameters?: EnumMember[];
  /**
   * Stored return type visibility configuration.
   */
  returnType?: EnumMember[];
}

const [getOperationVisibilityConfigRaw, setOperationVisibilityConfigRaw] = useStateMap<
  Operation,
  OperationVisibilityConfig
>(createStateSymbol("operationVisibilityConfig"));

function getOperationVisibilityConfig(
  program: Program,
  operation: Operation,
): OperationVisibilityConfig {
  let config = getOperationVisibilityConfigRaw(program, operation);

  if (!config) {
    config = {};

    setOperationVisibilityConfigRaw(program, operation, config);
  }

  return config;
}

export const $parameterVisibility: ParameterVisibilityDecorator = (
  context: DecoratorContext,
  operation: Operation,
  ...modifiers: EnumValue[]
) => {
  validateDecoratorUniqueOnNode(context, operation, $parameterVisibility);

  if (modifiers.length === 0) {
    reportDiagnostic(context.program, {
      code: "operation-visibility-constraint-empty",
      messageId: "parameter",
      target: context.decoratorTarget,
    });
    return;
  }

  getOperationVisibilityConfig(context.program, operation).parameters = modifiers.map(
    (m) => m.value,
  );
};

/**
 * A context-specific provider for visibility information that applies when parameter or return type visibility
 * constraints are not explicitly specified. Visibility providers are provided by libraries that define implied
 * visibility semantics, such as `@typespec/http`.
 *
 * If you are not working in a protocol that has specific visibility semantics, you can use the
 * {@link EmptyVisibilityProvider} from this package as a default provider. It will consider all properties visible by
 * default unless otherwise explicitly specified.
 */
export interface VisibilityProvider {
  parameters(program: Program, operation: Operation): VisibilityFilter;
  returnType(program: Program, operation: Operation): VisibilityFilter;
}

/**
 * An empty visibility provider. This provider returns an empty filter that considers all properties visible. This filter
 * is used when no context-specific visibility provider is available.
 *
 * When working with an HTTP specification, use the `HttpVisibilityProvider` from the `@typespec/http` library instead.
 */
export const EmptyVisibilityProvider: VisibilityProvider = {
  parameters: () => ({}),
  returnType: () => ({}),
};

/**
 * Get the visibility filter that should apply to the parameters of the given operation, or `undefined` if no parameter
 * visibility is set.
 *
 * If you are not working in a protocol that has specific implicit visibility semantics, you can use the
 * {@link EmptyVisibilityProvider} as a default provider. If you working in a protocol or context where parameters have
 * implicit visibility transformations (like HTTP), you should use the visibility provider from that library (for HTTP,
 * use the `HttpVisibilityProvider` from the `@typespec/http` library).
 *
 * @param program - the Program in which the operation is defined
 * @param operation - the Operation to get the parameter visibility filter for
 * @param defaultProvider - a provider for visibility filters that apply when no visibility constraints are explicitly
 *                         set. Defaults to an empty provider that returns an empty filter if not provided.
 * @returns a visibility filter for the parameters of the operation, or `undefined` if no parameter visibility is set
 */
export function getParameterVisibilityFilter(
  program: Program,
  operation: Operation,
  defaultProvider: VisibilityProvider,
): VisibilityFilter {
  const operationVisibilityConfig = getOperationVisibilityConfig(program, operation);

  if (!operationVisibilityConfig.parameters) return defaultProvider.parameters(program, operation);

  compilerAssert(
    operationVisibilityConfig.parameters.length !== 0,
    "Empty parameter visibility constraint.",
  );

  return {
    // WARNING: the HTTP library depends on `any` being the only key in the filter object returned by this method.
    //          if you change this logic, you will need to update the HTTP library to account for differences in the
    //          returned object. HTTP does not currently have a way to express `all` or `none` constraints in the same
    //          way that the core visibility system does.
    any: new Set(operationVisibilityConfig.parameters),
  };
}

export const $returnTypeVisibility: ReturnTypeVisibilityDecorator = (
  context: DecoratorContext,
  operation: Operation,
  ...modifiers: EnumValue[]
) => {
  validateDecoratorUniqueOnNode(context, operation, $parameterVisibility);

  if (modifiers.length === 0) {
    reportDiagnostic(context.program, {
      code: "operation-visibility-constraint-empty",
      messageId: "returnType",
      target: context.decoratorTarget,
    });
    return;
  }

  getOperationVisibilityConfig(context.program, operation).returnType = modifiers.map(
    (m) => m.value,
  );
};

/**
 * Get the visibility filter that should apply to the return type of the given operation, or `undefined` if no return
 * type visibility is set.
 *
 * @param program - the Program in which the operation is defined
 * @param operation - the Operation to get the return type visibility filter for
 * @param defaultProvider - a provider for visibility filters that apply when no visibility constraints are explicitly
 *                          set. Defaults to an empty provider that returns an empty filter if not provided.
 * @returns a visibility filter for the return type of the operation, or `undefined` if no return type visibility is set
 */
export function getReturnTypeVisibilityFilter(
  program: Program,
  operation: Operation,
  defaultProvider: VisibilityProvider,
): VisibilityFilter {
  const visibilityConfig = getOperationVisibilityConfig(program, operation);

  if (!visibilityConfig.returnType) return defaultProvider.returnType(program, operation);

  compilerAssert(
    visibilityConfig.returnType.length !== 0,
    "Empty return type visibility constraint.",
  );

  return {
    // WARNING: the HTTP library depends on `any` being the only key in the filter object returned by this method.
    //          if you change this logic, you will need to update the HTTP library to account for differences in the
    //          returned object. HTTP does not currently have a way to express `all` or `none` constraints in the same
    //          way that the core visibility system does.
    any: new Set(visibilityConfig.returnType),
  };
}

// #endregion

// #region Core Visibility Decorators

// -- @visibility decorator ---------------------

export const $visibility: VisibilityDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  ...modifiers: EnumValue[]
) => {
  addVisibilityModifiers(
    context.program,
    target,
    modifiers.map((m) => m.value),
    context,
  );
};

// -- @removeVisibility decorator ---------------------

export const $removeVisibility: RemoveVisibilityDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  ...visibilities: EnumValue[]
) => {
  removeVisibilityModifiers(
    context.program,
    target,
    visibilities.map((v) => v.value),
  );
};

// -- @invisible decorator ---------------------

export const $invisible: InvisibleDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  visibilityClass: Enum,
) => {
  clearVisibilityModifiersForClass(context.program, target, visibilityClass);
};

// -- @defaultVisibility decorator ------------------

export const $defaultVisibility: DefaultVisibilityDecorator = (
  context: DecoratorContext,
  target: Enum,
  ...visibilities: EnumValue[]
) => {
  validateDecoratorUniqueOnNode(context, target, $defaultVisibility);

  const modifierSet = new Set<EnumMember>();

  for (const visibility of visibilities) {
    if (visibility.value.enum !== target) {
      reportDiagnostic(context.program, {
        code: "default-visibility-not-member",
        target: context.decoratorTarget,
      });
    } else {
      modifierSet.add(visibility.value);
    }
  }

  setDefaultModifierSetForVisibilityClass(context.program, target, modifierSet);
};

// #endregion

// #region Legacy Visibility Transforms

// -- @withVisibility decorator ---------------------

export const $withVisibility: WithVisibilityDecorator = (
  context: DecoratorContext,
  target: Model,
  ...modifiers: EnumValue[]
) => {
  const modifierMembers = modifiers.map((m) => m.value);
  const filter: VisibilityFilter = {
    all: new Set(modifierMembers),
  };

  const visibilityClasses = new Set(modifierMembers.map((m) => m.enum));
  filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, filter));
  for (const p of target.properties.values()) {
    for (const c of visibilityClasses) {
      resetVisibilityModifiersForClass(context.program, p, c);
    }
  }
};

// -- @withUpdateableProperties decorator ----------------------

/**
 * Filters a model for properties that are updateable.
 *
 * @param context - the program context
 * @param target - Model to filter for updateable properties
 */
export const $withUpdateableProperties: WithUpdateablePropertiesDecorator = (
  context: DecoratorContext,
  target: Type,
) => {
  if (!validateDecoratorTarget(context, target, "@withUpdateableProperties", "Model")) {
    return;
  }

  const filter: VisibilityFilter = {
    all: new Set([getLifecycleVisibilityEnum(context.program).members.get("Update")!]),
  };

  filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, filter));
};

// #endregion

// #region Mutator Driven Transforms

// -- @withVisibilityFilter decorator ----------------------

export const $withVisibilityFilter: WithVisibilityFilterDecorator = (
  context: DecoratorContext,
  target: Model,
  _filter: GeneratedVisibilityFilter,
) => {
  const filter = VisibilityFilter.fromDecoratorArgument(_filter);

  const vfMutator: Mutator = createVisibilityFilterMutator(filter, {
    decoratorFn: $withVisibilityFilter,
  });

  const { type } = mutateSubgraph(context.program, [vfMutator], target);

  target.properties = (type as Model).properties;
};

// -- @withLifecycleUpdate decorator ----------------------

export const $withLifecycleUpdate: WithLifecycleUpdateDecorator = (
  context: DecoratorContext,
  target: Model,
) => {
  const lifecycle = getLifecycleVisibilityEnum(context.program);
  const lifecycleUpdate: VisibilityFilter = {
    all: new Set([lifecycle.members.get("Update")!]),
  };

  const lifecycleCreateOrUpdate: VisibilityFilter = {
    any: new Set([lifecycle.members.get("Create")!, lifecycle.members.get("Update")!]),
  };

  const createOrUpdateMutator = createVisibilityFilterMutator(lifecycleCreateOrUpdate);

  const updateMutator = createVisibilityFilterMutator(lifecycleUpdate, {
    recur: createOrUpdateMutator,
    decoratorFn: $withLifecycleUpdate,
  });

  const { type } = mutateSubgraph(context.program, [updateMutator], target);

  target.properties = (type as Model).properties;
};

/**
 * Options for the `createVisibilityFilterMutator` function.
 */
interface CreateVisibilityFilterMutatorOptions {
  /**
   * A mutator to apply to the type of visible properties of the model. If not provided, applies the constructed
   * visibility filter mutator recursively.
   */
  recur?: Mutator;

  /**
   * Optionally, a decorator function to remove from the model's decorators, if present.
   *
   * This allows removing a decorator like `withVisibilityFilter` from the model after it has been applied
   * to avoid an infinite loop.
   */
  decoratorFn?: DecoratorFunction;
}

/**
 * Create a mutator that applies a visibility filter to a type.
 *
 * @param filter - The visibility filter to apply
 * @param options - optional settings for the mutator
 * @returns
 */
function createVisibilityFilterMutator(
  filter: VisibilityFilter,
  options: CreateVisibilityFilterMutatorOptions = {},
): Mutator {
  const visibilityClasses = VisibilityFilter.getVisibilityClasses(filter);
  const mpMutator: Mutator = {
    name: "VisibilityFilterProperty",
    ModelProperty: {
      filter: () => MutatorFlow.DoNotRecur,
      mutate: (prop, clone, program) => {
        // We need to create a copy of the decorators array to avoid modifying the original.
        // Decorators are _NOT_ cloned by the type kit, so we have to be careful not to modify the decorator arguments
        // of the original type.
        const decorators: DecoratorApplication[] = [];

        for (const decorator of prop.decorators) {
          const decFn = decorator.decorator;
          if (decFn === $visibility || decFn === $removeVisibility) {
            const nextArgs = decorator.args.filter((arg) => {
              if (arg.value.entityKind !== "Value") return false;

              const isString = arg.value.valueKind === "StringValue";
              const isOperativeVisibility =
                arg.value.valueKind === "EnumValue" && visibilityClasses.has(arg.value.value.enum);

              return !(isString || isOperativeVisibility);
            });

            if (nextArgs.length > 0) {
              decorators.push({
                ...decorator,
                args: nextArgs,
              });
            }
          } else if (decFn !== $invisible) {
            decorators.push(decorator);
          }
        }

        clone.decorators = decorators;

        for (const visibilityClass of visibilityClasses) {
          resetVisibilityModifiersForClass(program, clone, visibilityClass);
        }

        if (isMutableType(prop.type)) {
          clone.type = mutateSubgraph(program, [options.recur ?? self], prop.type).type;
        }
      },
    },
  };
  const self: Mutator = {
    name: "VisibilityFilter",
    Union: {
      filter: () => MutatorFlow.DoNotRecur,
      mutate: (union, clone, program) => {
        for (const [key, member] of union.variants) {
          if (member.type.kind === "Model" || member.type.kind === "Union") {
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
        for (const [key, prop] of model.properties) {
          if (!isVisible(program, prop, filter)) {
            // Property is not visible, remove it
            clone.properties.delete(key);
            realm.remove(clone);
          } else {
            const mutated = mutateSubgraph(program, [mpMutator], prop);

            clone.properties.set(key, mutated.type as ModelProperty);
          }
        }

        if (options.decoratorFn) {
          clone.decorators = clone.decorators.filter((d) => d.decorator !== options.decoratorFn);
        }
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

// #endregion
