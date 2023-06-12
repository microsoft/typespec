import { getSourceLocation } from "../index.js";
import { Program } from "../program.js";
import { DeclarationContext, Type } from "../types.js";

export function getTypeDeclerationContext(program: Program, type: Type): DeclarationContext {
  const sourceLocation = getSourceLocation(type);

  if (sourceLocation.isSynthetic) {
    return { type: "synthetic" };
  }
  return program.getSourceFileDeclarationContext(sourceLocation.file);
}
