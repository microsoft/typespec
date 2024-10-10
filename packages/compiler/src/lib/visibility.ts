import type {
  DefaultVisibilityDecorator,
  VisibilityFilter as GeneratedVisibilityFilter,
  InvisibleDecorator,
  ParameterVisibilityDecorator,
  ReturnTypeVisibilityDecorator,
  VisibilityDecorator,
  WithDefaultKeyVisibilityDecorator,
  WithUpdateablePropertiesDecorator,
  WithVisibilityDecorator,
  WithVisibilityFilterDecorator,
} from "../../generated-defs/TypeSpec.js";
import { validateDecoratorTarget, validateDecoratorUniqueOnNode } from "../core/decorator-utils.js";
import {
  addVisibilityModifiers,
  clearVisibilityModifiersForClass,
  getVisibility,
  isVisible,
  Program,
  setDefaultModifierSetForVisibilityClass,
  setLegacyVisibility,
  splitLegacyVisibility,
  VisibilityFilter,
} from "../core/index.js";
import { reportDiagnostic } from "../core/messages.js";
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
  getLifecycleVisibilityEnum,
  normalizeLegacyLifecycleVisibilityString,
} from "../core/visibility/lifecycle.js";
import { createStateSymbol, filterModelPropertiesInPlace, isKey } from "./decorators.js";

// #region Legacy Visibility Utilities

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

export const parameterVisibilityKey = createStateSymbol("parameterVisibility");

export const $parameterVisibility: ParameterVisibilityDecorator = (
  context: DecoratorContext,
  entity: Operation,
  ...visibilities: (string | EnumValue)[]
) => {
  validateDecoratorUniqueOnNode(context, entity, $parameterVisibility);
  context.program.stateMap(parameterVisibilityKey).set(entity, visibilities);
};

/**
 * Returns the visibilities of the parameters of the given operation, if provided with `@parameterVisibility`.
 *
 * @see {@link $parameterVisibility}
 */
export function getParameterVisibility(program: Program, entity: Operation): string[] | undefined {
  return program.stateMap(parameterVisibilityKey).get(entity);
}

export const returnTypeVisibilityKey = createStateSymbol("returnTypeVisibility");

export const $returnTypeVisibility: ReturnTypeVisibilityDecorator = (
  context: DecoratorContext,
  entity: Operation,
  ...visibilities: (string | EnumValue)[]
) => {
  validateDecoratorUniqueOnNode(context, entity, $returnTypeVisibility);
  context.program.stateMap(returnTypeVisibilityKey).set(entity, visibilities);
};

/**
 * Returns the visibilities of the return type of the given operation, if provided with `@returnTypeVisibility`.
 *
 * @see {@link $returnTypeVisibility}
 */
export function getReturnTypeVisibility(program: Program, entity: Operation): string[] | undefined {
  return program.stateMap(returnTypeVisibilityKey).get(entity);
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

  setDefaultModifierSetForVisibilityClass(target, modifierSet);
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

    const filter: VisibilityFilter = {
      all: new Set(
        legacyVisibilities
          .map((v) => normalizeLegacyLifecycleVisibilityString(context.program, v))
          .filter((v) => !!v),
      ),
    };

    filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, filter));
    for (const p of target.properties.values()) {
      clearVisibilityModifiersForClass(
        context.program,
        p,
        getLifecycleVisibilityEnum(context.program),
      );
    }
  } else {
    const filter: VisibilityFilter = {
      all: new Set(modifiers),
    };

    const visibilityClasses = new Set(modifiers.map((m) => m.enum));
    filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, filter));
    for (const p of target.properties.values()) {
      for (const c of visibilityClasses) {
        clearVisibilityModifiersForClass(context.program, p, c);
      }
    }
  }
};

// -- @withUpdateableProperties decorator ----------------------

const UPDATE_VISIBILITY_MODIFIERS = new WeakMap<Program, EnumMember>();

function getUpdateVisibilityModifier(program: Program): EnumMember {
  let modifier = UPDATE_VISIBILITY_MODIFIERS.get(program);

  if (!modifier) {
    const lifecycle = getLifecycleVisibilityEnum(program);
    modifier = lifecycle.members.get("Update")!;
    UPDATE_VISIBILITY_MODIFIERS.set(program, modifier);
  }

  return modifier;
}

export const $withUpdateableProperties: WithUpdateablePropertiesDecorator = (
  context: DecoratorContext,
  target: Type,
) => {
  if (!validateDecoratorTarget(context, target, "@withUpdateableProperties", "Model")) {
    return;
  }

  const filter: VisibilityFilter = {
    all: new Set([getUpdateVisibilityModifier(context.program)]),
  };

  filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, filter));
};

// -- @withVisibilityFilter decorator ----------------------

export const $withVisibilityFilter: WithVisibilityFilterDecorator = (
  context: DecoratorContext,
  target: Model,
  _filter: GeneratedVisibilityFilter,
) => {
  const filter = VisibilityFilter.fromDecoratorArgument(_filter);

  // TODO
  throw new Error("Not implemented.");
};

// #endregion
