// Copyright (c) Microsoft Corporation
// Licensed under the MIT license.

import { compilerAssert } from "../diagnostics.js";
import type { Program } from "../program.js";
import { isProjectedProgram } from "../projected-program.js";
import type { Enum } from "../types.js";

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
    "Encountered diagnostics when resolving the `TypeSpec.Lifecycle` visibility class enum",
  );

  compilerAssert(type!.kind === "Enum", "Expected `TypeSpec.Visibility.Lifecycle` to be an enum");

  if (isProjectedProgram(program)) {
    const projectedType = program.projector.projectType(type);

    compilerAssert(
      projectedType.entityKind === "Type" && projectedType.kind === "Enum",
      "Expected `TypeSpec.Visibility.Lifecycle` to be an Enum (projected)",
    );

    LIFECYCLE_ENUM_CACHE.set(program, projectedType);

    return projectedType;
  } else {
    LIFECYCLE_ENUM_CACHE.set(program, type);

    return type;
  }
}
