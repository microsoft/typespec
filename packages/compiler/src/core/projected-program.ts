import type { Program, ProjectedProgram } from "./index.js";

export function isProjectedProgram(
  program: Program | ProjectedProgram,
): program is ProjectedProgram {
  return "projector" in program;
}
