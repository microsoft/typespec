import { getSourceLocation } from "../index.js";
import { Program } from "../program.js";
import { LocationContext, Type } from "../types.js";

export function getTypeDeclerationContext(program: Program, type: Type): LocationContext {
  const sourceLocation = getSourceLocation(type);

  if (sourceLocation.isSynthetic) {
    return { type: "synthetic" };
  }
  return program.getSourceFileLocationContext(sourceLocation.file);
}
