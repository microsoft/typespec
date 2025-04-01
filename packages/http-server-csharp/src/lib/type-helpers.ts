import {
  Enum,
  IndeterminateEntity,
  ModelProperty,
  Program,
  Scalar,
  Type,
  Value,
  getMaxLength,
  getMinLength,
  getPattern,
  isArrayModelType,
} from "@typespec/compiler";
import { CSharpType } from "./interfaces.js";

/**
 * Utility function to determine if a given type is a record type
 * @param program The program to process
 * @param type The type to check
 * @returns true if the type is a Record<T>, or false otherwise
 */
export function getRecordType(program: Program, type: Type): Type | undefined {
  if (
    program.checker.isStdType(type, "Record") &&
    type.kind === "Model" &&
    type.indexer?.value !== undefined
  )
    return type.indexer.value;

  return undefined;
}

export type EnumValueType = "string" | "int" | "double";

export function getDoubleType() {
  return new CSharpType({
    name: "double",
    namespace: "System",
    isBuiltIn: true,
    isValueType: true,
  });
}

export function getEnumType(en: Enum): EnumValueType | undefined {
  let result: EnumValueType | undefined = undefined;
  for (const [_, member] of en.members) {
    if (member.value === undefined) {
      return "string";
    }
    switch (typeof member.value) {
      case "string":
        return "string";
      case "number":
        const val = member.value?.toString();
        if (val === undefined) return undefined;
        if (val.includes(".")) {
          return "double";
        }
        if (result === undefined || result === "int") result = "int";
    }
  }

  return result;
}

/**
 * Determines if the type is an array type
 * @param program The program to process
 * @param type The type to check
 * @returns true if the type is an array or a model property with array type, otherwise false
 */
export function isArrayType(program: Program, type: ModelProperty | Scalar): boolean {
  return (
    type.kind === "ModelProperty" &&
    type.type.kind === "Model" &&
    isArrayModelType(program, type.type)
  );
}

/** Inner representation of s string constraint */
export interface StringConstraint {
  minLength?: number;
  maxLength?: number;
  pattern?: string;
}

/**
 * Returns the string constraints for the given type
 * @param program The program to process
 * @param type A model property or scalar to check
 * @returns The string constraint
 */
export function getStringConstraint(
  program: Program,
  type: ModelProperty | Scalar,
): StringConstraint | undefined {
  if (type.kind === "ModelProperty" && type.type.kind !== "Scalar") return undefined;
  const result: StringConstraint = {
    minLength: getMinLength(program, type),
    maxLength: getMaxLength(program, type),
    pattern: getPattern(program, type),
  };

  let innerResult: StringConstraint | undefined;
  if (type.kind === "ModelProperty" && type.type.kind === "Scalar") {
    innerResult = getStringConstraint(program, type.type);
  }
  if (type.kind === "Scalar" && type.baseScalar?.kind === "Scalar") {
    innerResult = getStringConstraint(program, type.baseScalar);
  }

  result.maxLength = result.maxLength === undefined ? innerResult?.maxLength : result.maxLength;
  result.minLength = result.minLength === undefined ? innerResult?.minLength : result.minLength;
  result.pattern = result.pattern === undefined ? innerResult?.pattern : result.pattern;
  if (
    result.maxLength === undefined &&
    result.minLength === undefined &&
    result.pattern === undefined
  )
    return undefined;
  return result;
}

/**
 * Returns an unknown type
 * @param program The program to check
 * @returns an unknown type
 */
export function getUnknownType(program: Program): Type {
  return program.checker.createType({ kind: "Intrinsic", name: "unknown", isFinished: true });
}

/**
 * Determines if the given type is a known value or literal type
 * @param program
 */
export function isKnownReferenceType(
  program: Program,
  type: Type | Value | IndeterminateEntity,
): boolean {
  if (type.entityKind === "Indeterminate" || type.entityKind === "Value") return false;

  return (
    type.kind !== "Boolean" &&
    type.kind !== "Intrinsic" &&
    type.kind !== "Number" &&
    type.kind !== "String" &&
    type.kind !== "Tuple"
  );
}
