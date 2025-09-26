// Contains all intrinsic data setter or getter
// Anything that the TypeSpec check might should be here.

import { DiscriminatedOptions } from "../../generated-defs/TypeSpec.js";
import { createStateSymbol } from "../lib/utils.js";
import { useStateMap } from "../utils/state-accessor.js";
import { isNumeric, type Numeric } from "./numeric.js";
import type { Program } from "./program.js";
import type { Model, ScalarValue, Type, Union } from "./types.js";

const stateKeys = {
  minValues: createStateSymbol("minValues"),
  maxValues: createStateSymbol("maxValues"),
  minValueExclusive: createStateSymbol("minValueExclusive"),
  maxValueExclusive: createStateSymbol("maxValueExclusive"),
  minLength: createStateSymbol("minLengthValues"),
  maxLength: createStateSymbol("maxLengthValues"),
  minItems: createStateSymbol("minItems"),
  maxItems: createStateSymbol("maxItems"),

  docs: createStateSymbol("docs"),
  returnDocs: createStateSymbol("returnsDocs"),
  errorsDocs: createStateSymbol("errorDocs"),

  discriminator: createStateSymbol("discriminator"),
};

// #region @minValue

const [
  /** Get the min value for numeric or scalar types like date times */
  getMinValueRaw,
  setMinValue,
] = useStateMap<Type, Numeric | ScalarValue>(stateKeys.minValues);

export { setMinValue };

/** Get the minimum value for a scalar type(datetime, duration, etc.). */
export function getMinValueForScalar(program: Program, target: Type): ScalarValue | undefined {
  const value = getMinValueRaw(program, target);
  return !isNumeric(value) ? value : undefined;
}

/** Get the minimum value for a numeric type. If the value cannot be represented as a JS number(Overflow) undefined will be returned */
export function getMinValueAsNumeric(program: Program, target: Type): Numeric | undefined {
  const value = getMinValueRaw(program, target);
  return isNumeric(value) ? value : undefined;
}

/**
 * Get the minimum value for a numeric type.
 * If the value cannot be represented as a JS number(Overflow) undefined will be returned
 * See {@link getMinValueAsNumeric} to get the precise value
 */
export function getMinValue(program: Program, target: Type): number | undefined {
  return getMinValueAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @minValue

// #region @maxValue

const [
  /** Get the max value for numeric or scalar types like date times */
  getMaxValueRaw,
  setMaxValue,
] = useStateMap<Type, Numeric | ScalarValue>(stateKeys.maxValues);

export { setMaxValue };

/** Get the maximum value for a scalar type(datetime, duration, etc.). */
export function getMaxValueForScalar(program: Program, target: Type): ScalarValue | undefined {
  const value = getMaxValueRaw(program, target);
  return !isNumeric(value) ? value : undefined;
}

/** Get the maximum value for a numeric type. If the value cannot be represented as a JS number(Overflow) undefined will be returned */
export function getMaxValueAsNumeric(program: Program, target: Type): Numeric | undefined {
  const value = getMaxValueRaw(program, target);
  return isNumeric(value) ? value : undefined;
}

/**
 * Get the maximum value for a numeric type.
 * If the value cannot be represented as a JS number(Overflow) undefined will be returned
 * See {@link getMaxValueAsNumeric} to get the precise value
 */
export function getMaxValue(program: Program, target: Type): number | undefined {
  return getMaxValueAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @maxValue

// #region @minValueExclusive

const [
  /** Get the min value exclusive for numeric or scalar types like date times */
  getMinValueExclusiveRaw,
  setMinValueExclusive,
] = useStateMap<Type, Numeric | ScalarValue>(stateKeys.minValueExclusive);

export { setMinValueExclusive };

/** Get the minimum value exclusive for a scalar type(datetime, duration, etc.). */
export function getMinValueExclusiveForScalar(
  program: Program,
  target: Type,
): ScalarValue | undefined {
  const value = getMinValueExclusiveRaw(program, target);
  return !isNumeric(value) ? value : undefined;
}

/** Get the minimum value exclusive for a numeric type. If the value cannot be represented as a JS number(Overflow) undefined will be returned */
export function getMinValueExclusiveAsNumeric(program: Program, target: Type): Numeric | undefined {
  const value = getMinValueExclusiveRaw(program, target);
  return isNumeric(value) ? value : undefined;
}

/**
 * Get the minimum value exclusive for a numeric type.
 * If the value cannot be represented as a JS number(Overflow) undefined will be returned
 * See {@link getMinValueExclusiveAsNumeric} to get the precise value
 */
export function getMinValueExclusive(program: Program, target: Type): number | undefined {
  return getMinValueExclusiveAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @minValueExclusive

// #region @maxValueExclusive

const [
  /** Get the max value exclusive for numeric or scalar types like date times */
  getMaxValueExclusiveRaw,
  setMaxValueExclusive,
] = useStateMap<Type, Numeric | ScalarValue>(stateKeys.maxValueExclusive);

export { setMaxValueExclusive };

/** Get the maximum value exclusive for a scalar type(datetime, duration, etc.). */
export function getMaxValueExclusiveForScalar(
  program: Program,
  target: Type,
): ScalarValue | undefined {
  const value = getMaxValueExclusiveRaw(program, target);
  return !isNumeric(value) ? value : undefined;
}

/** Get the maximum value exclusive for a numeric type. If the value cannot be represented as a JS number(Overflow) undefined will be returned */
export function getMaxValueExclusiveAsNumeric(program: Program, target: Type): Numeric | undefined {
  const value = getMaxValueExclusiveRaw(program, target);
  return isNumeric(value) ? value : undefined;
}

/**
 * Get the maximum value exclusive for a numeric type.
 * If the value cannot be represented as a JS number(Overflow) undefined will be returned
 * See {@link getMaxValueExclusiveAsNumeric} to get the precise value
 */
export function getMaxValueExclusive(program: Program, target: Type): number | undefined {
  return getMaxValueExclusiveAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @maxValueExclusive

// #region @minLength
export function setMinLength(program: Program, target: Type, value: Numeric): void {
  program.stateMap(stateKeys.minLength).set(target, value);
}

/**
 * Get the minimum length of a string type as a {@link Numeric} value.
 * @param program Current program
 * @param target Type with the `@minLength` decorator
 */
export function getMinLengthAsNumeric(program: Program, target: Type): Numeric | undefined {
  return program.stateMap(stateKeys.minLength).get(target);
}

export function getMinLength(program: Program, target: Type): number | undefined {
  return getMinLengthAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @minLength

// #region @maxLength
export function setMaxLength(program: Program, target: Type, value: Numeric): void {
  program.stateMap(stateKeys.maxLength).set(target, value);
}

/**
 * Get the minimum length of a string type as a {@link Numeric} value.
 * @param program Current program
 * @param target Type with the `@maxLength` decorator
 */
export function getMaxLengthAsNumeric(program: Program, target: Type): Numeric | undefined {
  return program.stateMap(stateKeys.maxLength).get(target);
}

export function getMaxLength(program: Program, target: Type): number | undefined {
  return getMaxLengthAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @maxLength

// #region @minItems
export function setMinItems(program: Program, target: Type, value: Numeric): void {
  program.stateMap(stateKeys.minItems).set(target, value);
}

export function getMinItemsAsNumeric(program: Program, target: Type): Numeric | undefined {
  return program.stateMap(stateKeys.minItems).get(target);
}

export function getMinItems(program: Program, target: Type): number | undefined {
  return getMinItemsAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @minItems

// #region @minItems
export function setMaxItems(program: Program, target: Type, value: Numeric): void {
  program.stateMap(stateKeys.maxItems).set(target, value);
}

export function getMaxItemsAsNumeric(program: Program, target: Type): Numeric | undefined {
  return program.stateMap(stateKeys.maxItems).get(target);
}

export function getMaxItems(program: Program, target: Type): number | undefined {
  return getMaxItemsAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @maxItems

// #region doc

/** @internal */
export type DocTarget = "self" | "returns" | "errors";

export interface DocData {
  /**
   * Doc value.
   */
  value: string;

  /**
   * How was the doc set.
   * - `decorator` means the `@doc` decorator was used
   * - `comment` means it was set from a `/** comment * /`
   */
  source: "decorator" | "comment";
}

/** @internal */
export function setDocData(program: Program, target: Type, key: DocTarget, data: DocData) {
  program.stateMap(getDocKey(key)).set(target, data);
}

function getDocKey(target: DocTarget): symbol {
  switch (target) {
    case "self":
      return stateKeys.docs;
    case "returns":
      return stateKeys.returnDocs;
    case "errors":
      return stateKeys.errorsDocs;
  }
}

/**
 * @internal
 * Get the documentation information for the given type. In most cases you probably just want to use {@link getDoc}
 * @param program Program
 * @param target Type
 * @returns Doc data with source information.
 */
export function getDocDataInternal(
  program: Program,
  target: Type,
  key: DocTarget,
): DocData | undefined {
  return program.stateMap(getDocKey(key)).get(target);
}

/**
 * Get the documentation information for the given type. In most cases you probably just want to use {@link getDoc}
 * @param program Program
 * @param target Type
 * @returns Doc data with source information.
 */
export function getDocData(program: Program, target: Type): DocData | undefined {
  return getDocDataInternal(program, target, "self");
}
// #endregion doc

// #region discriminator

export interface Discriminator {
  readonly propertyName: string;
}

export function setDiscriminator(program: Program, entity: Type, discriminator: Discriminator) {
  program.stateMap(stateKeys.discriminator).set(entity, discriminator);
}

export function getDiscriminator(program: Program, entity: Type): Discriminator | undefined {
  return program.stateMap(stateKeys.discriminator).get(entity);
}

export function getDiscriminatedTypes(program: Program): [Model | Union, Discriminator][] {
  return [...program.stateMap(stateKeys.discriminator).entries()] as any;
}

export const [getDiscriminatedOptions, setDiscriminatedOptions] = useStateMap<
  Union,
  Required<DiscriminatedOptions>
>(createStateSymbol("discriminated"));
// #endregion
