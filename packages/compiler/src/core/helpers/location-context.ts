import { getSourceLocation } from "../diagnostics.js";
import type { Program } from "../program.js";
import type { DiagnosticTarget, LocationContext } from "../types.js";

export function getLocationContext(program: Program, type: DiagnosticTarget): LocationContext {
  const sourceLocation = getSourceLocation(type);

  if (sourceLocation.isSynthetic) {
    return { type: "synthetic" };
  }
  return program.getSourceFileLocationContext(sourceLocation.file);
}
