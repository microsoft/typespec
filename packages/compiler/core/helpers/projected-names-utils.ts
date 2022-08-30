import { Program, ProjectedProgram, projectProgram } from "../program.js";
import { Type } from "../types.js";

export interface ProjectedNameView {
  program: ProjectedProgram;

  /**
   * Get the name of the given entity in that scope.
   * If there is a projected name it returns that one otherwise return the original name.
   */
  getProjectedName(target: Type & { name: string }): string;
}

/**
 * Create an helper to manager project names.
 * @param program Program
 * @param target Name of the projected name target(e.g. json, csharp, etc.)
 * @returns ProjectedNameView
 */
export function createProjectedNameProgram(program: Program, target: string): ProjectedNameView {
  const projectedProgram = projectProgram(program, [
    {
      projectionName: "target",
      arguments: [target],
    },
  ]);

  return {
    program: projectedProgram,
    getProjectedName,
  };

  function getProjectedName(type: Type & { name: string }): string {
    const baseType = type.projectionBase ?? type;
    const projectedType = projectedProgram.projector.projectedTypes.get(baseType);
    if (projectedType === undefined || !("name" in projectedType)) {
      return type.name;
    }
    return projectedType.name as string;
  }
}
