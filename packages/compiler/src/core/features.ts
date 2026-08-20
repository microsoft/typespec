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
  "declaration-expressions": {
    description:
      "Allows use of declaration expressions (named or anonymous model, scalar, enum and union declarations in expression position) without experimental warnings in project code.",
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
  // Without a target, fall back to the root project config (e.g. global feature checks).
  if (target === undefined) {
    return program.compilerOptions.configFile?.features?.includes(feature) ?? false;
  }

  // Resolve the feature set from the package that owns the source file so that a library
  // can enable a feature for its own code via its own `tspconfig.yaml`, independently of
  // the consuming project's config.
  const context = getLocationContext(program, target);
  switch (context.type) {
    case "project":
      return program.compilerOptions.configFile?.features?.includes(feature) ?? false;
    case "library":
      return context.features?.includes(feature) ?? false;
    default:
      // compiler (standard library) and synthetic code are never gated.
      return false;
  }
}
