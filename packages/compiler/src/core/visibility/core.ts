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
import {
  getLifecycleVisibilityEnum,
  normalizeLegacyLifecycleVisibilityString,
} from "./lifecycle.js";

import type { VisibilityFilter as GeneratedVisibilityFilter } from "../../../generated-defs/TypeSpec.js";
import { useStateMap, useStateSet } from "../../lib/utils.js";

export { GeneratedVisibilityFilter };

/**
 * A set of active visibility modifiers per visibility class.
 */
type VisibilityModifiers = Map<Enum, Set<EnumMember>>;

/**
 * The global visibility store.
 *
 * This store is used to track the visibility modifiers
 */
const [getVisibilityStore, setVisibilityStore] = useStateMap<ModelProperty, VisibilityModifiers>(
  "visibilityStore",
);

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
  "propertyVisibilitySealed",
);

const [getSealedVisibilityClasses, setSealedVisibilityClasses] = useStateMap<
  ModelProperty,
  Set<Enum>
>("sealedVisibilityClasses");

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
  "defaultVisibilityModifiers",
);

function getDefaultModifierSetForClass(program: Program, visibilityClass: Enum): Set<EnumMember> {
  const cached = getDefaultModifiers(program, visibilityClass);

  if (cached) return cached;

  const defaultModifierSet = new Set<EnumMember>(visibilityClass.members.values());

  setDefaultModifiers(program, visibilityClass, defaultModifierSet);

  return defaultModifierSet;
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

// #region Legacy Visibility API

const [getLegacyVisibility, setLegacyVisibilityModifiers, getLegacyVisibilityStateMap] =
  useStateMap<ModelProperty, string[]>("legacyVisibility");

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
  const { program } = context;
  compilerAssert(
    getLegacyVisibility(program, property) === undefined,
    "Legacy visibility modifiers have already been set for this property.",
  );

  setLegacyVisibilityModifiers(program, property, visibilities);

  const lifecycleClass = getLifecycleVisibilityEnum(program);

  if (visibilities.length === 1 && visibilities[0] === "none") {
    clearVisibilityModifiersForClass(program, property, lifecycleClass, context);
  } else {
    const lifecycleVisibilities = visibilities
      .map((v) => normalizeLegacyLifecycleVisibilityString(program, v))
      .filter((v) => !!v);

    addVisibilityModifiers(program, property, lifecycleVisibilities);
  }

  sealVisibilityModifiers(program, property, lifecycleClass);
}

/**
 * Removes legacy visibility modifiers from a property.
 *
 * @param program - the program in which the property occurs
 * @param property - the property to remove visibility modifiers from
 */
export function clearLegacyVisibility(program: Program, property: ModelProperty) {
  getLegacyVisibilityStateMap(program).delete(property);
}

/**
 * Returns the legacy visibility modifiers for a property.
 *
 * For a property using the enum-driven visibility system, the active Lifecycle visibility modifiers will be converted
 * to strings for backwards compatibility as follows:
 *
 * - If Lifecycle visibility is not explicitly set, and no legacy visibility is set, this function will return `undefined`.
 * - If the property has no active Lifecycle visibility modifiers, this function will return `["none"]`.
 * - Otherwise, this function will return an array of lowercase strings representing the active Lifecycle visibility
 *   modifiers ("create", "read", "update").
 *
 * @deprecated Use `getVisibilityForClass` or `getLifecycleVisibility` instead.
 * @param program - the program in which the property occurs
 * @param property - the property to get legacy visibility modifiers for
 */
export function getVisibility(program: Program, property: ModelProperty): string[] | undefined {
  const legacyModifiers = getLegacyVisibility(program, property);

  if (legacyModifiers) return legacyModifiers;

  // Now check for applied lifecycle visibility modifiers and coerce them if necessary.

  const lifecycleModifiers = getVisibilityStore(program, property)?.get(
    getLifecycleVisibilityEnum(program),
  );

  // Visibility is completely uninitialized, so return undefined to mimic legacy behavior.
  if (!lifecycleModifiers) return undefined;

  // Visibility has been cleared explicitly: return ["none"] to mimic legacy application of visibility "none".
  if (lifecycleModifiers.size === 0) return ["none"];

  // Otherwise we just convert the modifiers to strings.
  return Array.from(lifecycleModifiers).map((v) => v.name.toLowerCase());
}

// #endregion

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
      /* defaultSet: */ getDefaultModifierSetForClass(program, visibilityClass),
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

export function getVisibilityForClass(
  program: Program,
  property: ModelProperty,
  visibilityClass: Enum,
): Set<EnumMember> {
  return getOrInitializeActiveModifierSetForClass(
    program,
    property,
    visibilityClass,
    /* defaultSet: */ getDefaultModifierSetForClass(program, visibilityClass),
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
    /* defaultSet: */ getDefaultModifierSetForClass(program, modifier.enum),
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
  getVisibilityClasses(filter: VisibilityFilter): Set<Enum> {
    const classes = new Set<Enum>();
    if (filter.all) filter.all.forEach((v) => classes.add(v.enum));
    if (filter.any) filter.any.forEach((v) => classes.add(v.enum));
    if (filter.none) filter.none.forEach((v) => classes.add(v.enum));
    return classes;
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
