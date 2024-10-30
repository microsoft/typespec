// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.

import type {
  DefaultVisibilityDecorator,
  InvisibleDecorator,
  ParameterVisibilityDecorator,
  ReturnTypeVisibilityDecorator,
  VisibilityDecorator,
  WithDefaultKeyVisibilityDecorator,
  WithLifecycleUpdateDecorator,
  WithUpdateablePropertiesDecorator,
  WithVisibilityDecorator,
  WithVisibilityFilterDecorator,
} from "../../generated-defs/TypeSpec.js";
import { validateDecoratorTarget, validateDecoratorUniqueOnNode } from "../core/decorator-utils.js";
import { reportDiagnostic } from "../core/messages.js";
import type { Program } from "../core/program.js";
import {
  DecoratorContext,
  Enum,
  EnumMember,
  EnumValue,
  Model,
  ModelProperty,
  Operation,
  Type,
} from "../core/types.js";
import {
  addVisibilityModifiers,
  clearLegacyVisibility,
  clearVisibilityModifiersForClass,
  GeneratedVisibilityFilter,
  getVisibility,
  isVisible,
  resetVisibilityModifiersForClass,
  setDefaultModifierSetForVisibilityClass,
  setLegacyVisibility,
  VisibilityFilter,
} from "../core/visibility/core.js";
import {
  getLifecycleVisibilityEnum,
  normalizeVisibilityToLegacyLifecycleString,
} from "../core/visibility/lifecycle.js";
import { mutateSubgraph, Mutator, MutatorFlow } from "../experimental/mutators.js";
import { isKey } from "./key.js";
import { filterModelPropertiesInPlace, useStateMap } from "./utils.js";

// #region Legacy Visibility Utilities

/**
 * Takes a list of visibilities that possibly include both legacy visibility
 * strings and visibility class members, and returns two lists containing only
 * each type.
 *
 * @param visibilities - The list of visibilities to split
 * @returns a tuple containing visibility enum members in the first position and
 *         legacy visibility strings in the second position
 */
function splitLegacyVisibility(visibilities: (string | EnumValue)[]): [EnumMember[], string[]] {
  const legacyVisibilities = [] as string[];
  const modifiers = [] as EnumMember[];

  for (const visibility of visibilities) {
    if (typeof visibility === "string") {
      legacyVisibilities.push(visibility);
    } else {
      modifiers.push(visibility.value);
    }
  }

  return [modifiers, legacyVisibilities] as const;
}

export const $withDefaultKeyVisibility: WithDefaultKeyVisibilityDecorator = (
  context: DecoratorContext,
  entity: Model,
  visibility: string | EnumValue,
) => {
  const keyProperties: ModelProperty[] = [];
  entity.properties.forEach((prop: ModelProperty) => {
    // Keep track of any key property without a visibility
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    if (isKey(context.program, prop) && !getVisibility(context.program, prop)) {
      keyProperties.push(prop);
    }
  });

  // For each key property without a visibility, clone it and add the specified
  // default visibility value
  keyProperties.forEach((keyProp) => {
    entity.properties.set(
      keyProp.name,
      context.program.checker.cloneType(keyProp, {
        decorators: [
          ...keyProp.decorators,
          {
            decorator: $visibility,
            args: [
              {
                value:
                  typeof visibility === "string"
                    ? context.program.checker.createLiteralType(visibility)
                    : visibility,
                jsValue: visibility,
              },
            ],
          },
        ],
      }),
    );
  });
};

interface OperationVisibilityConfig {
  parameters?: string[] | EnumMember[];
  returnType?: string[] | EnumMember[];
}

const [getOperationVisibilityConfigRaw, setOperationVisibilityConfigRaw] = useStateMap<
  Operation,
  OperationVisibilityConfig
>("operationVisibilityConfig");

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
  ...visibilities: (string | EnumValue)[]
) => {
  validateDecoratorUniqueOnNode(context, operation, $parameterVisibility);

  const [modifiers, legacyVisibilities] = splitLegacyVisibility(visibilities);

  if (modifiers.length > 0 && legacyVisibilities.length > 0) {
    reportDiagnostic(context.program, {
      code: "visibility-mixed-legacy",
      target: context.decoratorTarget,
    });

    return;
  }

  if (modifiers.length > 0) {
    getOperationVisibilityConfig(context.program, operation).parameters = modifiers;
  } else {
    getOperationVisibilityConfig(context.program, operation).parameters = legacyVisibilities;
  }
};

/**
 * Returns the visibilities of the parameters of the given operation, if provided with `@parameterVisibility`.
 *
 * @deprecated Use {@link getParameterVisibilityFilter} instead.
 *
 * @see {@link $parameterVisibility}
 */
export function getParameterVisibility(program: Program, entity: Operation): string[] | undefined {
  return getOperationVisibilityConfig(program, entity)
    .parameters?.map((p) =>
      typeof p === "string" ? p : normalizeVisibilityToLegacyLifecycleString(program, p),
    )
    .filter((p) => !!p) as string[];
}

export const $returnTypeVisibility: ReturnTypeVisibilityDecorator = (
  context: DecoratorContext,
  operation: Operation,
  ...visibilities: (string | EnumValue)[]
) => {
  validateDecoratorUniqueOnNode(context, operation, $parameterVisibility);

  const [modifiers, legacyVisibilities] = splitLegacyVisibility(visibilities);

  if (modifiers.length > 0 && legacyVisibilities.length > 0) {
    reportDiagnostic(context.program, {
      code: "visibility-mixed-legacy",
      target: context.decoratorTarget,
    });

    return;
  }

  if (modifiers.length > 0) {
    getOperationVisibilityConfig(context.program, operation).returnType = modifiers;
  } else {
    getOperationVisibilityConfig(context.program, operation).returnType = legacyVisibilities;
  }
};

/**
 * Returns the visibilities of the return type of the given operation, if provided with `@returnTypeVisibility`.
 *
 * @deprecated Use {@link getReturnTypeVisibilityFilter} instead.
 *
 * @see {@link $returnTypeVisibility}
 */
export function getReturnTypeVisibility(program: Program, entity: Operation): string[] | undefined {
  return getOperationVisibilityConfig(program, entity)
    .returnType?.map((p) =>
      typeof p === "string" ? p : normalizeVisibilityToLegacyLifecycleString(program, p),
    )
    .filter((p) => !!p) as string[];
}

// -- @visibility decorator ---------------------

export const $visibility: VisibilityDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  ...visibilities: (string | EnumValue)[]
) => {
  const [modifiers, legacyVisibilities] = splitLegacyVisibility(visibilities);

  if (legacyVisibilities.length > 0) {
    const isUnique = validateDecoratorUniqueOnNode(context, target, $visibility);

    if (modifiers.length > 0) {
      reportDiagnostic(context.program, {
        code: "visibility-mixed-legacy",
        target: context.decoratorTarget,
      });

      return;
    }

    // Only attempt to set the legacy visibility modifiers if the visibility invocation is unique. Otherwise, a compiler
    // assertion will fail inside the legacy visibility management API.
    if (isUnique) setLegacyVisibility(context, target, legacyVisibilities);
  } else {
    addVisibilityModifiers(context.program, target, modifiers, context);
  }
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

// -- @withVisibility decorator ---------------------

export const $withVisibility: WithVisibilityDecorator = (
  context: DecoratorContext,
  target: Model,
  ...visibilities: (string | EnumValue)[]
) => {
  const [modifiers, legacyVisibilities] = splitLegacyVisibility(visibilities);

  if (legacyVisibilities.length > 0) {
    if (modifiers.length > 0) {
      reportDiagnostic(context.program, {
        code: "visibility-mixed-legacy",
        target: context.decoratorTarget,
      });

      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-deprecated
    filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, legacyVisibilities));

    for (const p of target.properties.values()) {
      // eslint-disable-next-line @typescript-eslint/no-deprecated
      const legacyModifiers = getVisibility(context.program, p);

      if (legacyModifiers && legacyModifiers.length > 0) {
        clearLegacyVisibility(context.program, p);
      } else {
        resetVisibilityModifiersForClass(
          context.program,
          p,
          getLifecycleVisibilityEnum(context.program),
        );
      }
    }
  } else {
    const filter: VisibilityFilter = {
      all: new Set(modifiers),
    };

    const visibilityClasses = new Set(modifiers.map((m) => m.enum));
    filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, filter));
    for (const p of target.properties.values()) {
      for (const c of visibilityClasses) {
        resetVisibilityModifiersForClass(context.program, p, c);
      }
    }
  }
};

// -- @withUpdateableProperties decorator ----------------------

/**
 * Filters a model for properties that are updateable.
 *
 * @deprecated Use `@withVisibilityFilter` or `@withLifecycleVisibility` instead.
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

  // eslint-disable-next-line @typescript-eslint/no-deprecated
  filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, ["update"]));
};

// -- @withVisibilityFilter decorator ----------------------

export const $withVisibilityFilter: WithVisibilityFilterDecorator = (
  context: DecoratorContext,
  target: Model,
  _filter: GeneratedVisibilityFilter,
) => {
  const filter = VisibilityFilter.fromDecoratorArgument(_filter);

  const vfMutator: Mutator = createVisibilityFilterMutator(filter);

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

  const createOrUpdateMutator = createVisibilityFilterMutator({
    any: new Set([lifecycle.members.get("Create")!, lifecycle.members.get("Update")!]),
  });

  const updateMutator: Mutator = {
    name: "LifecycleUpdate",
    Model: {
      mutate: (model, clone, program, realm) => {
        for (const [key, prop] of model.properties) {
          if (!isVisible(program, prop, lifecycleUpdate)) {
            clone.properties.delete(key);
            realm.remove(prop);
          } else if (prop.type.kind === "Model") {
            const { type } = mutateSubgraph(program, [createOrUpdateMutator], prop.type);

            prop.type = type;
          }

          resetVisibilityModifiersForClass(program, prop, lifecycle);
        }

        clone.decorators = clone.decorators.filter((d) => d.decorator !== $withLifecycleUpdate);

        return MutatorFlow.DoNotRecurse;
      },
    },
  };

  const { type } = mutateSubgraph(context.program, [updateMutator], target);

  target.properties = (type as Model).properties;
};

function createVisibilityFilterMutator(filter: VisibilityFilter): Mutator {
  const self: Mutator = {
    name: "VisibilityFilter",
    Model: {
      mutate: (model, clone, program, realm) => {
        for (const [key, prop] of model.properties) {
          if (!isVisible(program, prop, filter)) {
            clone.properties.delete(key);
            realm.remove(prop);
          } else if (prop.type.kind === "Model") {
            const { type } = mutateSubgraph(program, [self], prop.type);

            prop.type = type;
          }

          for (const visibilityClass of VisibilityFilter.getVisibilityClasses(filter)) {
            resetVisibilityModifiersForClass(program, prop, visibilityClass);
          }
        }

        clone.decorators = clone.decorators.filter((d) => d.decorator !== $withVisibilityFilter);

        return MutatorFlow.DoNotRecurse;
      },
    },
  };

  return self;
}
// #endregion
