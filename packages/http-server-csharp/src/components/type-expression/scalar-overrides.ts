import type { Scalar } from "@typespec/compiler";
import type { Typekit } from "@typespec/compiler/typekit";
import { getScalarIntrinsicExpression } from "@typespec/emitter-framework/csharp";

/**
 * The scalars whose C# representation differs from the emitter-framework defaults:
 *
 * - `plainDate` / `plainTime` → `DateTime` (not `DateOnly` / `TimeOnly`)
 * - `url` → `string` (not `Uri`)
 * - `safeint` → `long` (not `int`)
 * - sized integers use CLR type names (`SByte`, `Int16`, …) rather than C# keywords
 *
 * These reproduce the output of the pre-Alloy emitter and are deliberate, not oversights.
 */
export function getServerScalarOverrides($: Typekit): [Scalar, string][] {
  return [
    [$.builtin.plainDate, "DateTime"],
    [$.builtin.plainTime, "DateTime"],
    [$.builtin.url, "string"],
    [$.builtin.int8, "SByte"],
    [$.builtin.uint8, "Byte"],
    [$.builtin.int16, "Int16"],
    [$.builtin.uint16, "UInt16"],
    [$.builtin.uint32, "UInt32"],
    [$.builtin.uint64, "UInt64"],
    [$.builtin.safeInt, "long"],
  ];
}

/**
 * Resolves the C# type name for a scalar, applying the server overrides on top of the
 * emitter-framework defaults.
 *
 * This is the single source of truth for scalar naming. Anywhere a C# type *name* is needed
 * outside of a rendering context — constraint attribute type arguments, error constructor
 * parameter types — must go through here so that the name always agrees with what
 * `TypeExpression` renders for the same scalar.
 */
export function getServerScalarName($: Typekit, scalar: Scalar): string {
  const overrides = new Map(getServerScalarOverrides($));
  // Custom scalars (`scalar myDate extends plainDate`) inherit their base's mapping.
  let current: Scalar | undefined = scalar;
  while (current) {
    const override = overrides.get(current);
    if (override) return override;
    current = current.baseScalar;
  }
  return getScalarIntrinsicExpression($, scalar);
}

/**
 * Like {@link getServerScalarName}, but returns undefined for scalars that do not derive
 * from a TypeSpec std scalar, where no meaningful C# type name can be produced.
 */
export function tryGetServerScalarName($: Typekit, scalar: Scalar): string | undefined {
  if (!$.scalar.getStdBase(scalar)) return undefined;
  return getServerScalarName($, scalar);
}
