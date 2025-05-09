// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

// TypeSpec Visibility System
// --------------------------

// This module defines the core visibility system of the TypeSpec language. The
// visibility system is used to decide when properties of a _conceptual resource_
// are present. The system is based on the concept of _visibility classes_,
// represented by TypeSpec enums. Each visibility class has a set of _visibility
// modifiers_ that can be applied to a model property, each modifier represented
// by a member of the visibility class enum.
//
// Each visibility class has a _default modifier set_ that is used when no
// modifiers are specified for a property, and each property has an _active
// modifier set_ that is used when analyzing the visibility of the property.
//
// Visibility can be _sealed_ for a program, property, or visibility class
// within a property. Once visibility is sealed, it cannot be unsealed, and any
// attempts to modify a sealed visibility will fail.

import { compilerAssert } from "../diagnostics.js";
import { reportDiagnostic } from "../messages.js";
import type { Program } from "../program.js";
import type { DecoratorContext, Enum, EnumMember, ModelProperty } from "../types.js";

import type { VisibilityFilter as GeneratedVisibilityFilter } from "../../../generated-defs/TypeSpec.js";
import { createStateSymbol } from "../../lib/utils.js";
import { useStateMap, useStateSet } from "../../utils/index.js";

export { GeneratedVisibilityFilter };

/**
 * A set of active visibility modifiers per visibility class.
 * @internal
 */
export type VisibilityModifiers = Map<Enum, Set<EnumMember>>;

/**
 * The global visibility store.
 *
 * This store is used to track the visibility modifiers
 */
const [getVisibilityStore, setVisibilityStore] = useStateMap<ModelProperty, VisibilityModifiers>(
  createStateSymbol("visibilityStore"),
);

/**
 * Provides access to the visibility store.
 * @internal
 */
export function getRawVisibilityStore(
  ...params: Parameters<typeof getVisibilityStore>
): ReturnType<typeof getVisibilityStore> {
  return getVisibilityStore(...params);
}

/**
 * Returns the visibility modifiers for a given `property` within a `program`.
 */
function getOrInitializeVisibilityModifiers(
  program: Program,
  property: ModelProperty,
): VisibilityModifiers {
  let visibilityModifiers = getVisibilityStore(program, property);

  if (!visibilityModifiers) {
    visibilityModifiers = new Map();
    setVisibilityStore(program, property, visibilityModifiers);
  }

  return visibilityModifiers;
}

/**
 * Returns the active visibility modifier set for a given `property` and `visibilityClass`.
 *
 * If no visibility modifiers have been set for the given `property` and `visibilityClass`, the function will use the
 * provided `defaultSet` to initialize the visibility modifiers.
 *
 * @param program - the program in which the property occurs
 * @param property - the property to get visibility modifiers for
 * @param visibilityClass - the visibility class to get visibility modifiers for
 * @param defaultSet - the default set to use if no set has been initialized
 * @returns the active visibility modifier set for the given property and visibility class
 */
function getOrInitializeActiveModifierSetForClass(
  program: Program,
  property: ModelProperty,
  visibilityClass: Enum,
  defaultSet: Set<EnumMember>,
): Set<EnumMember> {
  const visibilityModifiers = getOrInitializeVisibilityModifiers(program, property);
  let visibilityModifierSet = visibilityModifiers.get(visibilityClass);

  if (!visibilityModifierSet) {
    visibilityModifierSet = defaultSet;
    visibilityModifiers.set(visibilityClass, visibilityModifierSet);
  }

  return visibilityModifierSet;
}

/**
 * If a Program is in this set, visibility is sealed for all properties in that Program.
 */
const VISIBILITY_PROGRAM_SEALS = new WeakSet<Program>();

const [isVisibilitySealedForProperty, sealVisibilityForProperty] = useStateSet<ModelProperty>(
  createStateSymbol("propertyVisibilitySealed"),
);

const [getSealedVisibilityClasses, setSealedVisibilityClasses] = useStateMap<
  ModelProperty,
  Set<Enum>
>(createStateSymbol("sealedVisibilityClasses"));

/**
 * Seals visibility modifiers for a property in a given visibility class.
 *
 * @param program - the program in which the property occurs
 * @param property - the property to seal visibility modifiers for
 * @param visibilityClass - the visibility class to seal visibility modifiers for
 */
function sealVisibilityModifiersForClass(
  program: Program,
  property: ModelProperty,
  visibilityClass: Enum,
) {
  let sealedClasses = getSealedVisibilityClasses(program, property);

  if (!sealedClasses) {
    sealedClasses = new Set();
    setSealedVisibilityClasses(program, property, sealedClasses);
  }

  sealedClasses.add(visibilityClass);
}

/**
 * Stores the default modifier set for a given visibility class.
 */
const [getDefaultModifiers, setDefaultModifiers] = useStateMap<Enum, Set<EnumMember>>(
  createStateSymbol("defaultVisibilityModifiers"),
);

/**
 * Gets the default modifier set for a visibility class. If no default modifier set has been set, this function will
 * initialize the default modifier set to ALL the visibility class's members.
 *
 * @param program - the program in which the visibility class occurs
 * @param visibilityClass - the visibility class to get the default modifier set for
 * @returns the default modifier set for the visibility class
 */
function getDefaultModifierSetForClass(program: Program, visibilityClass: Enum): Set<EnumMember> {
  const cached = getDefaultModifiers(program, visibilityClass);

  if (cached) return new Set(cached);

  const defaultModifierSet = new Set<EnumMember>(visibilityClass.members.values());

  setDefaultModifiers(program, visibilityClass, defaultModifierSet);

  // Explicitly clone the set again to prevent accidental modification of the default set.
  return new Set(defaultModifierSet);
}

/**
 * Set the default visibility modifier set for a visibility class.
 *
 * This function may only be called ONCE per visibility class and must be called
 * before the default modifier set is used by any operation.
 */
export function setDefaultModifierSetForVisibilityClass(
  program: Program,
  visibilityClass: Enum,
  defaultSet: Set<EnumMember>,
) {
  compilerAssert(
    !getDefaultModifiers(program, visibilityClass),
    "The default modifier set for a visibility class may only be set once.",
  );

  setDefaultModifiers(program, visibilityClass, defaultSet);
}

/**
 * Convert a sequence of visibility modifiers into a map of visibility classes to their respective modifiers in the
 * sequence.
 *
 * @param modifiers - the visibility modifiers to group
 * @returns a map of visibility classes to their respective modifiers in the input list
 */
function groupModifiersByVisibilityClass(modifiers: EnumMember[]): Map<Enum, Set<EnumMember>> {
  const enumMap = new Map<Enum, Set<EnumMember>>();

  // Prepare new modifier sets for each visibility class
  for (const modifier of modifiers) {
    const visibilityClass = modifier.enum;

    let modifierSet = enumMap.get(visibilityClass);

    if (!modifierSet) {
      modifierSet = new Set();
      enumMap.set(visibilityClass, modifierSet);
    }

    modifierSet.add(modifier);
  }

  return enumMap;
}

// #region Visibility Management API

/**
 * Check if a property has had its visibility modifiers sealed.
 *
 * If the property has been sealed globally, this function will return true. If the property has been sealed for the
 * given visibility class, this function will return true.
 *
 * Otherwise, this function returns false.
 *
 * @param property - the property to check
 * @param visibilityClass - the optional visibility class to check
 * @returns true if the property is sealed for the given visibility class, false otherwise
 */
export function isSealed(
  program: Program,
  property: ModelProperty,
  visibilityClass?: Enum,
): boolean {
  if (VISIBILITY_PROGRAM_SEALS.has(program)) return true;

  const classSealed = visibilityClass
    ? getSealedVisibilityClasses(program, property)?.has(visibilityClass)
    : false;

  return classSealed || isVisibilitySealedForProperty(program, property);
}

/**
 * Seals a property's visibility modifiers.
 *
 * If the `visibilityClass` is provided, the property's visibility modifiers will be sealed for that visibility class
 * only. Otherwise, the property's visibility modifiers will be sealed for all visibility classes (globally).
 *
 * @param property - the property to seal
 * @param visibilityClass - the optional visibility class to seal the property for
 */
export function sealVisibilityModifiers(
  program: Program,
  property: ModelProperty,
  visibilityClass?: Enum,
) {
  if (visibilityClass) {
    sealVisibilityModifiersForClass(program, property, visibilityClass);
  } else {
    sealVisibilityForProperty(program, property);
  }
}

/**
 * Seals a program's visibility modifiers.
 *
 * This affects all properties in the program and prevents any further modifications to visibility modifiers within the
 * program.
 *
 * Once the modifiers for a program are sealed, they cannot be unsealed.
 *
 * @param program - the program to seal
 */
export function sealVisibilityModifiersForProgram(program: Program) {
  VISIBILITY_PROGRAM_SEALS.add(program);
}

/**
 * Add visibility modifiers to a property.
 *
 * This function will add all the `modifiers` to the active set of visibility modifiers for the given `property`.
 *
 * If no set of active modifiers exists for the given `property`, an empty set will be created for the property.
 *
 * If the visibility modifiers for `property` in the given modifier's visibility class have been sealed, this function
 * will issue a diagnostic and ignore that modifier, but it will still add the rest of the modifiers whose classes have
 * not been sealed.
 *
 * @param program - the program in which the ModelProperty occurs
 * @param property - the property to add visibility modifiers to
 * @param modifiers - the visibility modifiers to add
 * @param context - the optional decorator context to use for displaying diagnostics
 */
export function addVisibilityModifiers(
  program: Program,
  property: ModelProperty,
  modifiers: EnumMember[],
  context?: DecoratorContext,
) {
  const modifiersByClass = groupModifiersByVisibilityClass(modifiers);

  for (const [visibilityClass, newModifiers] of modifiersByClass.entries()) {
    const target = context?.decoratorTarget ?? property;
    if (isSealed(program, property, visibilityClass)) {
      reportDiagnostic(program, {
        code: "visibility-sealed",
        format: {
          propName: property.name,
        },
        target,
      });
      continue;
    }

    const modifierSet = getOrInitializeActiveModifierSetForClass(
      program,
      property,
      visibilityClass,
      /* defaultSet: */ new Set(),
    );

    for (const modifier of newModifiers) {
      modifierSet.add(modifier);
    }
  }
}

/**
 * Remove visibility modifiers from a property.
 *
 * This function will remove all the `modifiers` from the active set of visibility modifiers for the given `property`.
 *
 * If no set of active modifiers exists for the given `property`, the default set for the modifier's visibility class
 * will be used.
 *
 * If the visibility modifiers for `property` in the given modifier's visibility class have been sealed, this function
 * will issue a diagnostic and ignore that modifier, but it will still remove the rest of the modifiers whose classes
 * have not been sealed.
 *
 * @param program - the program in which the ModelProperty occurs
 * @param property - the property to remove visibility modifiers from
 * @param modifiers - the visibility modifiers to remove
 * @param context - the optional decorator context to use for displaying diagnostics
 */
export function removeVisibilityModifiers(
  program: Program,
  property: ModelProperty,
  modifiers: EnumMember[],
  context?: DecoratorContext,
) {
  const modifiersByClass = groupModifiersByVisibilityClass(modifiers);

  for (const [visibilityClass, newModifiers] of modifiersByClass.entries()) {
    const target = context?.decoratorTarget ?? property;
    if (isSealed(program, property, visibilityClass)) {
      reportDiagnostic(program, {
        code: "visibility-sealed",
        format: {
          propName: property.name,
        },
        target,
      });
      continue;
    }

    const modifierSet = getOrInitializeActiveModifierSetForClass(
      program,
      property,
      visibilityClass,
      /* defaultSet: */ getDefaultModifierSetForClass(program, visibilityClass),
    );

    for (const modifier of newModifiers) {
      modifierSet.delete(modifier);
    }
  }
}

/**
 * Clears the visibility modifiers for a property in a given visibility class.
 *
 * If the visibility modifiers for the given class are sealed, this function will issue a diagnostic and leave the
 * visibility modifiers unchanged.
 *
 * @param program - the program in which the ModelProperty occurs
 * @param property - the property to clear visibility modifiers for
 * @param visibilityClass - the visibility class to clear visibility modifiers for
 * @param context - the optional decorator context to use for displaying diagnostics
 */
export function clearVisibilityModifiersForClass(
  program: Program,
  property: ModelProperty,
  visibilityClass: Enum,
  context?: DecoratorContext,
) {
  const target = context?.decoratorTarget ?? property;
  if (isSealed(program, property, visibilityClass)) {
    reportDiagnostic(program, {
      code: "visibility-sealed",
      format: {
        propName: property.name,
      },
      target,
    });
    return;
  }

  const modifierSet = getOrInitializeActiveModifierSetForClass(
    program,
    property,
    visibilityClass,
    /* defaultSet: */ new Set(),
  );

  modifierSet.clear();
}

/**
 * Resets the visibility modifiers for a property in a given visibility class.
 *
 * This does not clear the modifiers. It resets them to the _uninitialized_ state.
 *
 * This is useful when cloning properties and you want to reset the visibility modifiers on the clone.
 *
 * If the visibility modifiers for this property and given visibility class are sealed, this function will issue a
 * diagnostic and leave the visibility modifiers unchanged.
 *
 * @param program - the program in which the property occurs
 * @param property - the property to reset visibility modifiers for
 * @param visibilityClass - the visibility class to reset visibility modifiers for
 * @param context - the optional decorator context to use for displaying diagnostics
 */
export function resetVisibilityModifiersForClass(
  program: Program,
  property: ModelProperty,
  visibilityClass: Enum,
  context?: DecoratorContext,
) {
  const target = context?.decoratorTarget ?? property;

  if (isSealed(program, property, visibilityClass)) {
    reportDiagnostic(program, {
      code: "visibility-sealed",
      format: {
        propName: property.name,
      },
      target,
    });
    return;
  }

  getOrInitializeVisibilityModifiers(program, property).delete(visibilityClass);
}

// #endregion

// #region Visibility Analysis API

/**
 * Returns the active visibility modifiers for a property in a given visibility class.
 *
 * This function is infallible. If the visibility modifiers for the given class have not been set explicitly, it will
 * return the default visibility modifiers for the class.
 *
 * @param program - the program in which the property occurs
 * @param property - the property to get visibility modifiers for
 * @param visibilityClass - the visibility class to get visibility modifiers for
 * @returns the set of active modifiers (enum members) for the property and visibility class
 */
export function getVisibilityForClass(
  program: Program,
  property: ModelProperty,
  visibilityClass: Enum,
): Set<EnumMember> {
  const store = getVisibilityStore(program, property);

  return store?.get(visibilityClass) ?? getDefaultModifierSetForClass(program, visibilityClass);
}

/**
 * Determines if a property has a specified visibility modifier.
 *
 * If no visibility modifiers have been set for the visibility class of the modifier, the visibility class's default
 * modifier set is used.
 *
 * @param program - the program in which the property occurs
 * @param property - the property to check
 * @param modifier - the visibility modifier to check for
 * @returns true if the property has the visibility modifier, false otherwise
 */
export function hasVisibility(
  program: Program,
  property: ModelProperty,
  modifier: EnumMember,
): boolean {
  const visibilityClass = modifier.enum;

  return getVisibilityForClass(program, property, visibilityClass).has(modifier) ?? false;
}

/**
 * A visibility filter that can be used to determine if a property is visible.
 *
 * The filter is defined by three sets of visibility modifiers. The filter is satisfied if the property has:
 *
 * - ALL of the visibilities in the `all` set.
 *
 * AND
 *
 * - ANY of the visibilities in the `any` set.
 *
 * AND
 *
 * - NONE of the visibilities in the `none` set.
 *
 * Note: The constraints behave similarly to the `every` and `some` methods of the Array prototype in JavaScript. If the
 * `any` constraint is set to an empty set, it will _NEVER_ be satisfied (similarly, `Array.prototype.some` will always
 * return `false` for an empty array). If the `none` constraint is set to an empty set, it will _ALWAYS_ be satisfied.
 * If the `all` constraint is set to an empty set, it will be satisfied (similarly, `Array.prototype.every` will always
 * return `true` for an empty array).
 *
 */
export interface VisibilityFilter {
  /**
   * If set, the filter considers a property visible if it has ALL of these visibility modifiers.
   *
   * If this set is empty, the filter will be satisfied if the other constraints are satisfied.
   */
  all?: Set<EnumMember>;
  /**
   * If set, the filter considers a property visible if it has ANY of these visibility modifiers.
   *
   * If this set is empty, the filter will _NEVER_ be satisfied.
   */
  any?: Set<EnumMember>;
  /**
   * If set, the filter considers a property visible if it has NONE of these visibility modifiers.
   *
   * If this set is empty, the filter will be satisfied if the other constraints are satisfied.
   */
  none?: Set<EnumMember>;
}

const VISIBILITY_FILTER = Symbol.for("TypeSpec.Core.VisibilityFilter");

interface VisibilityFilterCache {
  [VISIBILITY_FILTER]?: VisibilityFilter;
}

export const VisibilityFilter = {
  /**
   * Convert a TypeSpec `GeneratedVisibilityFilter` value to a `VisibilityFilter`.
   *
   * @param filter - the decorator argument filter to convert
   * @returns a `VisibilityFilter` object that can be consumed by the visibility APIs
   */
  fromDecoratorArgument(filter: GeneratedVisibilityFilter): VisibilityFilter {
    return ((filter as VisibilityFilterCache)[VISIBILITY_FILTER] ??= {
      all: filter.all && new Set(filter.all.map((v) => v.value)),
      any: filter.any && new Set(filter.any.map((v) => v.value)),
      none: filter.none && new Set(filter.none.map((v) => v.value)),
    });
  },
  /**
   * Extracts the unique visibility classes referred to by the modifiers in a
   * visibility filter.
   *
   * @param filter - the visibility filter to extract visibility classes from
   * @returns a set of visibility classes referred to by the filter
   */
  getVisibilityClasses(filter: VisibilityFilter): Set<Enum> {
    const classes = new Set<Enum>();
    if (filter.all) filter.all.forEach((v) => classes.add(v.enum));
    if (filter.any) filter.any.forEach((v) => classes.add(v.enum));
    if (filter.none) filter.none.forEach((v) => classes.add(v.enum));
    return classes;
  },
  /**
   * Converts a visibility filter into a stable string representation.
   *
   * This can be used as a cache key for the filter that will be stable for filters that are not object-identical but
   * are semantically identical.
   */
  toCacheKey(program: Program, filter: VisibilityFilter): string {
    return visibilityFilterToCacheKey(program, filter);
  },
};

const ENUM_INTERN_TABLE = Symbol.for("TypeSpec.Core.enumInternTable");

interface EnumInternTable {
  [ENUM_INTERN_TABLE]?: {
    idx: number;
    map: WeakMap<Enum, number>;
  };
}

function internEnum(program: Program, enumType: Enum): number {
  const enumInternTable = ((program as EnumInternTable)[ENUM_INTERN_TABLE] ??= {
    idx: 0,
    map: new WeakMap(),
  });

  let idx = enumInternTable.map.get(enumType);
  if (idx === undefined) {
    idx = enumInternTable.idx++;
    enumInternTable.map.set(enumType, idx);
  }

  return idx;
}

const VISIBILITY_FILTER_TO_STRING_CACHE = Symbol.for("TypeSpec.Core.visibilityFilterToStringCache");

interface VisibilityFilterToStringCache {
  [VISIBILITY_FILTER_TO_STRING_CACHE]?: WeakMap<VisibilityFilter, string>;
}

/**
 * Converts a visibility filter into a stable string representation.
 *
 * @param program - the program in which the filter is defined
 * @param filter - the visibility filter to convert
 * @returns a string representation of the visibility filter to use as a cache key
 */
function visibilityFilterToCacheKey(program: Program, filter: VisibilityFilter): string {
  const visibilityFilterToStringCache = ((program as VisibilityFilterToStringCache)[
    VISIBILITY_FILTER_TO_STRING_CACHE
  ] ??= new WeakMap());

  let str = visibilityFilterToStringCache.get(filter);

  if (str) {
    return str;
  }

  str = "{";

  for (const [key, modifierSet] of Object.entries(filter).sort(([keyA], [keyB]) =>
    keyA.localeCompare(keyB),
  ) as [keyof VisibilityFilter, VisibilityFilter[keyof VisibilityFilter]][]) {
    if (!modifierSet) continue;
    str += `${key}:[`;
    const values: Array<{ _enum: number; modifier: string }> = [];
    for (const modifier of modifierSet) {
      const enumType = internEnum(program, modifier.enum);
      values.push({ _enum: enumType, modifier: modifier.name });
    }

    str +=
      values
        .sort(function sortByEnumThenModifier(a, b) {
          if (a._enum !== b._enum) {
            return a._enum - b._enum;
          }
          return a.modifier.localeCompare(b.modifier);
        })
        .join(",") + "]";
  }

  str += "}";

  visibilityFilterToStringCache.set(filter, str);

  return str;
}

/**
 * Determines if a property is visible according to the given visibility filter.
 *
 * @see VisibilityFilter
 *
 * @param program - the program in which the property occurs
 * @param property - the property to check
 * @param filter - the visibility filter to use
 * @returns true if the property is visible according to the filter, false otherwise
 */
export function isVisible(
  program: Program,
  property: ModelProperty,
  filter: VisibilityFilter,
): boolean {
  // Validate that property has ALL of the required visibilities of filter.all
  if (filter.all) {
    for (const modifier of filter.all) {
      if (!hasVisibility(program, property, modifier)) return false;
    }
  }

  // Validate that property has NONE of the excluded visibilities of filter.none
  if (filter.none) {
    for (const modifier of filter.none) {
      if (hasVisibility(program, property, modifier)) return false;
    }
  }

  if (filter.any) {
    for (const modifier of filter.any) {
      if (hasVisibility(program, property, modifier)) return true;
    }

    return false;
  }

  return true;
}

// #endregion
