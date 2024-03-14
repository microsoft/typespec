import { Program, Type } from "@typespec/compiler";

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

/**
 * Returns an unknown type
 * @param program The program to check
 * @returns an unknown type
 */
export function getUnknownType(program: Program): Type {
  return program.checker.createType({ kind: "Intrinsic", name: "unknown", isFinished: true });
}
