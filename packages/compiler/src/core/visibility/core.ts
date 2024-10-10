// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

// TypeSpec Visibility System
// --------------------------

// This module defines the core visibility system of the TypeSpec language. The visibility system is used to decide when
// properties of a _conceptual resource_ are present. The system is based on the concept of _visibility classes_,
// represented by TypeSpec enums. Each visibility class has a set of _visibility modifiers_ that can be applied to a
// model property, each modifier represented by a member of the visibility class enum.
//
// Each visibility class has a _default modifier set_ that is used when no modifiers are specified for a property, and
// each property has an _active modifier set_ that is used when analyzing the visibility of the property.
//
// Visibility can be _sealed_ for a program, property, or visibility class within a property. Once visibility is sealed,
// it cannot be unsealed, and any attempts to modify a sealed visibility will fail.

import { compilerAssert } from "../diagnostics.js";
import { reportDiagnostic } from "../messages.js";
import { Program } from "../program.js";
import { DecoratorContext, Enum, EnumMember, EnumValue, ModelProperty } from "../types.js";
import {
  getLifecycleVisibilityEnum,
  normalizeLegacyLifecycleVisibilityString,
} from "./lifecycle.js";

import { VisibilityFilter as GeneratedVisibilityFilter } from "../../../generated-defs/TypeSpec.js";

/**
 * A set of active visibility modifiers per visibility class.
 */
type VisibilityModifiers = Map<Enum, Set<EnumMember>>;

/**
 * The global visibility store.
 *
 * This store is used to track the visibility modifiers
 */
const VISIBILITY_STORE = new WeakMap<ModelProperty, VisibilityModifiers>();

/**
 * Returns the visibility modifiers for a given `property` within a `program`.
 */
function getOrInitializeVisibilityModifiers(property: ModelProperty): VisibilityModifiers {
  let visibilityModifiers = VISIBILITY_STORE.get(property);

  if (!visibilityModifiers) {
    visibilityModifiers = new Map();
    VISIBILITY_STORE.set(property, visibilityModifiers);
  }

  return visibilityModifiers;
}

/**
 * Returns the active visibility modifier set for a given `property` and `visibilityClass`.
 *
 * If no visibility modifiers have been set for the given `property` and `visibilityClass`, the function will use the
 * provided `defaultSet` to initialize the visibility modifiers.
 *
 * @param program
 * @param property
 * @param visibilityClass
 * @param defaultSet - the default set to use if no set has been initialized
 * @returns
 */
function getOrInitializeActiveModifierSetForClass(
  program: Program,
  property: ModelProperty,
  visibilityClass: Enum,
  defaultSet: Set<EnumMember>,
): Set<EnumMember> {
  const visibilityModifiers = getOrInitializeVisibilityModifiers(property);
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

/**
 * If a property is in this set, visibility is sealed for that property.
 */
const VISIBILITY_SEALS = new WeakSet<ModelProperty>();

/**
 * If a property is a key in this map, visibility is sealed for that property within all the visibility classes in the
 * corresponding set.
 */
const VISIBILITY_SEALS_FOR_CLASS = new WeakMap<ModelProperty, Set<Enum>>();

function sealVisibilityModifiersForClass(property: ModelProperty, visibilityClass: Enum) {
  let sealedClasses = VISIBILITY_SEALS_FOR_CLASS.get(property);

  if (!sealedClasses) {
    sealedClasses = new Set();
    VISIBILITY_SEALS_FOR_CLASS.set(property, sealedClasses);
  }

  sealedClasses.add(visibilityClass);
}

/**
 * Stores the default modifier set for a given visibility class.
 */
const DEFAULT_MODIFIER_SET_CACHE = new WeakMap<Enum, Set<EnumMember>>();

function getDefaultModifierSetForClass(visibilityClass: Enum): Set<EnumMember> {
  const cached = DEFAULT_MODIFIER_SET_CACHE.get(visibilityClass);

  if (cached) return cached;

  const defaultModifierSet = new Set<EnumMember>(visibilityClass.members.values());

  DEFAULT_MODIFIER_SET_CACHE.set(visibilityClass, defaultModifierSet);

  return defaultModifierSet;
}

/**
 * Set the default visibility modifier set for a visibility class.
 *
 * This function may only be called ONCE per visibility class and must be called
 * before the default modifier set is used by any operation.
 */
export function setDefaultModifierSetForVisibilityClass(
  visibilityClass: Enum,
  defaultSet: Set<EnumMember>,
) {
  compilerAssert(
    !DEFAULT_MODIFIER_SET_CACHE.has(visibilityClass),
    "The default modifier set for a visibility class may only be set once.",
  );

  DEFAULT_MODIFIER_SET_CACHE.set(visibilityClass, defaultSet);
}

/**
 * Convert a sequence of visibility modifiers into a map of visibility classes to their respective modifiers in the
 * sequence.
 */
function groupModifiersByVisibilityClass(modifiers: EnumMember[]) {
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

// #region Legacy Visibility API

const LEGACY_VISIBILITY_MODIFIERS = new WeakMap<ModelProperty, string[]>();

/**
 * Sets the legacy visibility modifiers for a property.
 *
 * This function will also set the visibility modifiers for the property in the Lifecycle visibility class for any
 * strings in the visibility array that are recognized as lifecycle visibility strings.
 *
 * Calling this function twice on the same property will result in a failed compiler assertion.
 *
 * @param program - the program in which the property occurs
 * @param property - the property to set visibility modifiers for
 * @param visibilities - the legacy visibility strings to set
 */
export function setLegacyVisibility(
  context: DecoratorContext,
  property: ModelProperty,
  visibilities: string[],
) {
  compilerAssert(
    LEGACY_VISIBILITY_MODIFIERS.get(property) === undefined,
    "Legacy visibility modifiers have already been set for this property.",
  );

  LEGACY_VISIBILITY_MODIFIERS.set(property, visibilities);

  const lifecycleClass = getLifecycleVisibilityEnum(context.program);

  if (visibilities.length === 1 && visibilities[0] === "none") {
    clearVisibilityModifiersForClass(context.program, property, lifecycleClass, context);
  } else {
    const lifecycleVisibilities = visibilities
      .map((v) => normalizeLegacyLifecycleVisibilityString(context.program, v))
      .filter((v) => !!v);

    addVisibilityModifiers(context.program, property, lifecycleVisibilities);
  }

  sealVisibilityModifiers(property, lifecycleClass);
}

/**
 * Returns the legacy visibility modifiers for a property.
 *
 * @deprecated Use `getVisibilityForClass` or `getLifecycleVisibility` instead.
 * @param program - the program in which the property occurs
 * @param property - the property to get legacy visibility modifiers for
 */
export function getVisibility(program: Program, property: ModelProperty): string[] | undefined {
  void program;
  return LEGACY_VISIBILITY_MODIFIERS.get(property);
}

export function splitLegacyVisibility(
  visibilities: (string | EnumValue)[],
): [EnumMember[], string[]] {
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

// #endregion

// #region Visibility Management API

/**
 * Initializes the default modifier set for a visibility class.
 *
 * This function may be called once per visibility class to set the modifier set that should be used when no modifiers
 * are specified on a property for the given visibility class.
 *
 * If no default set is provided for a visibility class using this function, the default set will be the set of ALL
 * members/modifiers in the visibility class enum.
 *
 * This function may only be called ONCE per visibility class.
 *
 * @param visibilityClass
 * @param defaultSet
 */
export function initializeDefaultModifierSetForClass(
  visibilityClass: Enum,
  defaultSet: Set<EnumMember>,
) {
  compilerAssert(
    !DEFAULT_MODIFIER_SET_CACHE.has(visibilityClass),
    "The default modifier set for a visibility class may only be initialized once.",
  );

  DEFAULT_MODIFIER_SET_CACHE.set(visibilityClass, defaultSet);
}

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
    ? VISIBILITY_SEALS_FOR_CLASS.get(property)?.has(visibilityClass)
    : false;

  return classSealed || VISIBILITY_SEALS.has(property);
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
export function sealVisibilityModifiers(property: ModelProperty, visibilityClass?: Enum) {
  if (visibilityClass) {
    sealVisibilityModifiersForClass(property, visibilityClass);
  } else {
    VISIBILITY_SEALS.add(property);
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
 * @param program
 * @param property
 * @param modifiers
 * @param context
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
      /* defaultSet: */ getDefaultModifierSetForClass(visibilityClass),
    );

    for (const modifier of newModifiers) {
      modifierSet.delete(modifier);
    }
  }
}

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

// #endregion

// #region Visibility Analysis API

export function getVisibilityForClass(
  program: Program,
  property: ModelProperty,
  visibilityClass: Enum,
): Set<EnumMember> {
  return getOrInitializeActiveModifierSetForClass(
    program,
    property,
    visibilityClass,
    /* defaultSet: */ getDefaultModifierSetForClass(visibilityClass),
  );
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
  const activeSet = getOrInitializeActiveModifierSetForClass(
    program,
    property,
    modifier.enum,
    /* defaultSet: */ getDefaultModifierSetForClass(modifier.enum),
  );

  return activeSet?.has(modifier) ?? false;
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
 */
export interface VisibilityFilter {
  all?: Set<EnumMember>;
  any?: Set<EnumMember>;
  none?: Set<EnumMember>;
}

export const VisibilityFilter = {
  fromDecoratorArgument(filter: GeneratedVisibilityFilter): VisibilityFilter {
    return {
      all: filter.all && new Set(filter.all.map((v) => v.value)),
      any: filter.any && new Set(filter.any.map((v) => v.value)),
      none: filter.none && new Set(filter.none.map((v) => v.value)),
    };
  },
};

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
): boolean;
/**
 * Determines if a property has any of the specified (legacy) visibility strings.
 *
 * @deprecated This call signature is deprecated. Use the `VisibilityFilter` version instead.
 */
export function isVisible(
  program: Program,
  property: ModelProperty,
  visibilities: readonly string[],
): boolean;
export function isVisible(
  program: Program,
  property: ModelProperty,
  _filterOrLegacyVisibilities: VisibilityFilter | readonly string[],
): boolean {
  if (Array.isArray(_filterOrLegacyVisibilities)) {
    return isVisibleLegacy(_filterOrLegacyVisibilities);
  }

  const filter = { ...(_filterOrLegacyVisibilities as VisibilityFilter) };
  filter.all ??= new Set();
  filter.any ??= new Set();
  filter.none ??= new Set();

  // Validate that property has ALL of the required visibilities of filter.all
  for (const modifier of filter.all) {
    if (!hasVisibility(program, property, modifier)) return false;
  }

  // Validate that property has ANY of the required visibilities of filter.any
  outer: while (filter.any.size > 0) {
    for (const modifier of filter.any) {
      if (hasVisibility(program, property, modifier)) break outer;
    }

    return false;
  }

  // Validate that property has NONE of the excluded visibilities of filter.none
  for (const modifier of filter.none) {
    if (hasVisibility(program, property, modifier)) return false;
  }

  return true;

  function isVisibleLegacy(visibilities: readonly string[]) {
    // eslint-disable-next-line @typescript-eslint/no-deprecated
    const propertyVisibilities = getVisibility(program, property);
    return !propertyVisibilities || propertyVisibilities.some((v) => visibilities.includes(v));
  }
}

// #endregion
