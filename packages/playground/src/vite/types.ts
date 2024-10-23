import type { PlaygroundLinks } from "../react/playground.js";
import type { PlaygroundSampleConfig } from "../tooling/types.js";
import type { PlaygroundSample } from "../types.js";

export interface PlaygroundUserConfig extends Omit<PlaygroundConfig, "samples"> {
  /**
   * If the bundle library plugin should be loaded.
   */
  readonly skipBundleLibraries?: boolean;
  readonly samples?: Record<string, PlaygroundSampleConfig>;
}

export interface PlaygroundConfig {
  readonly defaultEmitter: string;
  readonly libraries: readonly string[];
  readonly samples: Record<string, PlaygroundSample>;
  readonly links?: PlaygroundLinks;
}
