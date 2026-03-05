/**
 * Feature registry for TypeSpec language features that can be enabled/disabled
 * via `#enable` / `#disable` directives.
 *
 * Features go through a lifecycle:
 * 1. "opt-in"    — Available but off by default. Use `#enable "featureName"` to activate.
 * 2. "default"   — On by default. Use `#disable "featureName"` to temporarily opt-out.
 * 3. "mandatory" — Always on. `#enable` is a no-op, `#disable` produces a diagnostic.
 */

export type FeatureStatus = "opt-in" | "default" | "mandatory";

export interface FeatureDefinition {
  /** The feature name used in `#enable "name"` directives. */
  readonly name: string;
  /** Human-readable description of the feature. */
  readonly description: string;
  /** Current lifecycle status of the feature. */
  readonly status: FeatureStatus;
  /** Compiler version that introduced the feature. */
  readonly addedIn: string;
  /** Compiler version where it became default (undefined if still opt-in). */
  readonly defaultIn?: string;
  /** Compiler version where disable was removed (undefined if not yet mandatory). */
  readonly mandatoryIn?: string;
}

/**
 * Registry of all known TypeSpec language features.
 * Add new features here as they are introduced.
 */
const featureDefinitions: readonly FeatureDefinition[] = [
  // Placeholder feature for testing the feature system
  // {
  //   name: "example-feature",
  //   description: "An example feature for testing the feature opt-in system.",
  //   status: "opt-in",
  //   addedIn: "0.65.0",
  // },
];

const featureMap = new Map<string, FeatureDefinition>(
  featureDefinitions.map((f) => [f.name, f]),
);

/** Get the definition for a feature by name, or undefined if not found. */
export function getFeatureDefinition(name: string): FeatureDefinition | undefined {
  return featureMap.get(name);
}

/** Get all known feature definitions. */
export function getAllFeatureDefinitions(): readonly FeatureDefinition[] {
  return featureDefinitions;
}

/** Check whether a feature name is known to the compiler. */
export function isKnownFeature(name: string): boolean {
  return featureMap.has(name);
}
