// Contains all intrinsic data setter or getter
// Anything that the TypeSpec check might should be here.

import type { Model, Type, Union } from "./index.js";
import type { Numeric } from "./numeric.js";
import type { Program } from "./program.js";

function createStateSymbol(name: string) {
  return Symbol.for(`TypeSpec.${name}`);
}

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

export function setMinValue(program: Program, target: Type, value: Numeric): void {
  program.stateMap(stateKeys.minValues).set(target, value);
}

export function getMinValueAsNumeric(program: Program, target: Type): Numeric | undefined {
  return program.stateMap(stateKeys.minValues).get(target);
}

export function getMinValue(program: Program, target: Type): number | undefined {
  return getMinValueAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @minValue

// #region @maxValue

export function setMaxValue(program: Program, target: Type, value: Numeric): void {
  program.stateMap(stateKeys.maxValues).set(target, value);
}

export function getMaxValueAsNumeric(program: Program, target: Type): Numeric | undefined {
  return program.stateMap(stateKeys.maxValues).get(target);
}
export function getMaxValue(program: Program, target: Type): number | undefined {
  return getMaxValueAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @maxValue

// #region @minValueExclusive

export function setMinValueExclusive(program: Program, target: Type, value: Numeric): void {
  program.stateMap(stateKeys.minValueExclusive).set(target, value);
}

export function getMinValueExclusiveAsNumeric(program: Program, target: Type): Numeric | undefined {
  return program.stateMap(stateKeys.minValueExclusive).get(target);
}

export function getMinValueExclusive(program: Program, target: Type): number | undefined {
  return getMinValueExclusiveAsNumeric(program, target)?.asNumber() ?? undefined;
}
// #endregion @minValueExclusive

// #region @maxValueExclusive
export function setMaxValueExclusive(program: Program, target: Type, value: Numeric): void {
  program.stateMap(stateKeys.maxValueExclusive).set(target, value);
}

export function getMaxValueExclusiveAsNumeric(program: Program, target: Type): Numeric | undefined {
  return program.stateMap(stateKeys.maxValueExclusive).get(target);
}

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

// #endregion
