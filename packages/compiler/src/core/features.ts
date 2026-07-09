import { getLocationContext } from "./helpers/location-context.js";
import type { Program } from "./program.js";
import type { DiagnosticTarget } from "./types.js";

export interface CompilerFeatureDefinition {
  readonly description: string;
}

export const compilerFeatures = {
  "function-declarations": {
    description:
      "Allows use of function declarations without experimental warnings in project code.",
  },
  "auto-decorators": {
    description:
      "Allows use of auto decorator declarations without experimental warnings in project code.",
  },
} as const satisfies Record<string, CompilerFeatureDefinition>;

export type CompilerFeatureName = keyof typeof compilerFeatures;

export const compilerFeatureNames = Object.keys(compilerFeatures) as CompilerFeatureName[];

const compilerFeatureNameSet = new Set<string>(compilerFeatureNames);

export function isCompilerFeatureName(feature: string): feature is CompilerFeatureName {
  return compilerFeatureNameSet.has(feature);
}

export function isCompilerFeatureEnabled(
  program: Program,
  feature: CompilerFeatureName,
  target?: DiagnosticTarget,
): boolean {
  if (!program.compilerOptions.configFile?.features?.includes(feature)) {
    return false;
  }

  if (target === undefined) {
    return true;
  }

  return getLocationContext(program, target).type === "project";
}
