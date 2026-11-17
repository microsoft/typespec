import type { PlaygroundSampleConfig } from "../tooling/types.js";
import type { PlaygroundSample } from "../types.js";

/** Build-time playground configuration, with sample content read from files by the Vite plugin. */
export interface PlaygroundUserConfig extends Omit<PlaygroundConfig, "samples"> {
  /**
   * Skip bundling libraries when true. Defaults to false; use when bundles are supplied elsewhere.
   */
  readonly skipBundleLibraries?: boolean;
  /** Gallery entries keyed by display label, with filenames relative to the Vite root. */
  readonly samples?: Record<string, PlaygroundSampleConfig>;
}

/** Runtime configuration supplied by the generated `@typespec/playground/manifest` module. */
export interface PlaygroundConfig {
  /** Package name of the application's initial emitter. */
  readonly defaultEmitter: string;
  /** Package import specifiers to bundle and make available to the playground. */
  readonly libraries: readonly string[];
  /** Gallery entries keyed by display label, with source content already loaded. */
  readonly samples: Record<string, PlaygroundSample>;
}
