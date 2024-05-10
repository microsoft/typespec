import type { Program, ProjectedProgram } from "../program.js";
import { projectProgram } from "../program.js";
import type { Projector, Type } from "../types.js";

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
    const baseType = findTypeInProjector(projectedProgram.projector, type);
    const projectedType = projectedProgram.projector.projectedTypes.get(baseType);
    if (
      projectedType === undefined ||
      !("name" in projectedType) ||
      projectedType.name === baseType.name
    ) {
      return type.name;
    }
    return projectedType.name as string;
  }
}

// TODO will REALM help here?
function findTypeInProjector<T extends Type>(projector: Projector | undefined, type: T): T {
  if (type.projectionSource === undefined) {
    return type;
  } else if (type.projector === projector) {
    return type;
  } else {
    return findTypeInProjector(projector, type.projectionSource) as any;
  }
}
