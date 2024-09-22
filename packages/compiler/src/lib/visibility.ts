import type {
  InvisibleDecorator,
  ParameterVisibilityDecorator,
  ReturnTypeVisibilityDecorator,
  VisibilityDecorator,
  WithDefaultKeyVisibilityDecorator,
  WithUpdateablePropertiesDecorator,
  WithVisibilityDecorator,
} from "../../generated-defs/TypeSpec.js";
import { validateDecoratorTarget, validateDecoratorUniqueOnNode } from "../core/decorator-utils.js";
import {
  addVisibilityModifiers,
  clearVisibilityModifiersForClass,
  getVisibility,
  isVisible,
  Program,
  setLegacyVisibility,
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
import { createStateSymbol, filterModelPropertiesInPlace, isKey } from "./decorators.js";

// #region Legacy Visibility Utilities

export const $withDefaultKeyVisibility: WithDefaultKeyVisibilityDecorator = (
  context: DecoratorContext,
  entity: Model,
  visibility: string | EnumValue
) => {
  const keyProperties: ModelProperty[] = [];
  entity.properties.forEach((prop: ModelProperty) => {
    // Keep track of any key property without a visibility
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
      })
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
  const legacyVisibilities = [] as string[];
  const modifiers = [] as EnumMember[];

  for (const visibility of visibilities) {
    if (typeof visibility === "string") {
      legacyVisibilities.push(visibility);
    } else {
      modifiers.push(visibility.value);
    }
  }

  if (legacyVisibilities.length > 0) {
    const isUnique = validateDecoratorUniqueOnNode(context, target, $visibility);

    if (modifiers.length > 0) {
      reportDiagnostic(context.program, {
        code: "visibility-mixed-legacy",
        messageId: "same-invocation",
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

export const $invisible: InvisibleDecorator = (
  context: DecoratorContext,
  target: ModelProperty,
  visibilityClass: Enum
) => {
  clearVisibilityModifiersForClass(context.program, target, visibilityClass);
};

export const $withVisibility: WithVisibilityDecorator = (
  context: DecoratorContext,
  target: Model,
  ...visibilities: (string | EnumValue)[]
) => {
  filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, visibilities));
  [...target.properties.values()].forEach((p) => clearVisibilities(context.program, p));
};

// -- @withUpdateableProperties decorator ----------------------

export const $withUpdateableProperties: WithUpdateablePropertiesDecorator = (
  context: DecoratorContext,
  target: Type
) => {
  if (!validateDecoratorTarget(context, target, "@withUpdateableProperties", "Model")) {
    return;
  }

  filterModelPropertiesInPlace(target, (p) => isVisible(context.program, p, ["update"]));
};

// #endregion
