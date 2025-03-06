/* eslint-disable @typescript-eslint/no-deprecated */
import type { Program, ProjectedProgram } from "./program.js";

export function isProjectedProgram(
  program: Program | ProjectedProgram,
): program is ProjectedProgram {
  return "projector" in program;
}
