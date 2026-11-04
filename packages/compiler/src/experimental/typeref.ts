import type { Program } from "../core/program.js";
import type { BaseValue, FunctionContext, Scalar, Type } from "../core/types.js";

export function typeref(context: FunctionContext, target: Type): TypeRefValue {
  return {
    entityKind: "Value",
    valueKind: "TypeRefValue",
    type: context.program.checker.getTypeRefType(target),
    target,
  };
}

/**
 * The native generic scalar used to store a compile-time type reference.
 * Its template argument constrains the referenced type.
 * @experimental
 */
export interface TypeRefType extends Scalar {
  /** The name of the standard type-reference declaration. */
  name: "TypeRef";
}

/**
 * A value referencing an existing compiler type without copying it.
 * Its inferred storage type is `TypeRef<T>`; the precise referenced type is available through `target`.
 * @experimental
 */
export interface TypeRefValue extends BaseValue {
  /** Identifies this value as a reference to a compiler type. */
  valueKind: "TypeRefValue";
  /** The referenced compiler type, preserving its original identity. */
  target: Type;
}

/** Determines whether a type uses the standard type-reference declaration. */
export function isTypeRefType(program: Program, type: Type): type is TypeRefType {
  return (
    type.kind === "Scalar" &&
    type.name === "TypeRef" &&
    type.node !== undefined &&
    type.node ===
      program.getGlobalNamespaceType().namespaces.get("TypeSpec")?.scalars.get("TypeRef")?.node
  );
}
