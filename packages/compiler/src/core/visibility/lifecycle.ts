// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { compilerAssert } from "../diagnostics.js";
import { Program } from "../program.js";
import { Enum, EnumMember } from "../types.js";

/**
 * A cache for the `TypeSpec.Visibility.Lifecycle` enum per Program instance.
 */
const LIFECYCLE_ENUM_CACHE = new WeakMap<Program, Enum>();

/**
 * Returns the instance of `TypeSpec.Visibility.Lifecycle` for the given `program`.
 *
 * @param program - the program to get the lifecycle visibility enum for
 * @returns a reference to the lifecycle visibility enum
 */
export function getLifecycleVisibilityEnum(program: Program): Enum {
  const cached = LIFECYCLE_ENUM_CACHE.get(program);

  if (cached) return cached;

  const [type, diagnostics] = program.resolveTypeReference("TypeSpec.Lifecycle");

  compilerAssert(
    diagnostics.length === 0,
    "Encountered diagnostics when resolving the `TypeSpec.Lifecycle` visibility class enum"
  );

  compilerAssert(type!.kind === "Enum", "Expected `TypeSpec.Visibility.Lifecycle` to be an enum");

  LIFECYCLE_ENUM_CACHE.set(program, type);

  return type;
}

export function normalizeLegacyLifecycleVisibilityString(
  program: Program,
  visibility: string
): EnumMember | undefined {
  const lifecycle = getLifecycleVisibilityEnum(program);
  switch (visibility) {
    case "create":
      return lifecycle.members.get("Create")!;
    case "read":
      return lifecycle.members.get("Read")!;
    case "update":
      return lifecycle.members.get("Update")!;
    default:
      return undefined;
  }
}
