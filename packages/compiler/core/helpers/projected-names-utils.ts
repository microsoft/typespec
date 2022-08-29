import { Program, ProjectedProgram, projectProgram } from "../program.js";
import { Type } from "../types.js";

export interface ProjectedNameView {
  program: ProjectedProgram;
  getProjectedName(target: Type & { name: string }): string;
}

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
    const projectedType = projectedProgram.projector.projectedTypes.get(type);
    if (projectedType === undefined || !("name" in projectedType)) {
      return type.name;
    }
    return projectedType.name as string;
  }
}
