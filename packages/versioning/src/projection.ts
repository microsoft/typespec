import type { Namespace, ObjectType, Program, ProjectionApplication } from "@typespec/compiler";
import { VersioningStateKeys } from "./lib.js";
import { TimelineMoment, VersioningTimeline } from "./versioning-timeline.js";
import { resolveVersions } from "./versioning.js";

/**
 * Represent the set of projections used to project to that version.
 */
export interface VersionProjections {
  version: string | undefined;
  projections: ProjectionApplication[];
}

/**
 * @internal
 */
export function indexTimeline(
  program: Program,
  timeline: VersioningTimeline,
  projectingMoment: TimelineMoment,
) {
  const versionKey = program.checker.createType<ObjectType>({
    kind: "Object",
    properties: {},
  } as any);
  program
    .stateMap(VersioningStateKeys.versionIndex)
    .set(versionKey, { timeline, projectingMoment });
  return versionKey;
}

export function buildVersionProjections(program: Program, rootNs: Namespace): VersionProjections[] {
  const resolutions = resolveVersions(program, rootNs);
  const timeline = new VersioningTimeline(
    program,
    resolutions.map((x) => x.versions),
  );
  return resolutions.map((resolution) => {
    if (resolution.versions.size === 0) {
      return { version: undefined, projections: [] };
    } else {
      const versionKey = indexTimeline(
        program,
        timeline,
        timeline.get(resolution.versions.values().next().value!),
      );
      return {
        version: resolution.rootVersion?.value,
        projections: [
          {
            projectionName: "v",
            arguments: [versionKey],
          },
        ],
      };
    }
  });
}
