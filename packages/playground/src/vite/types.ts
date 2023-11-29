import { PlaygroundLinks } from "../react/playground.js";
import { PlaygroundSampleConfig } from "../tooling/types.js";
import { PlaygroundSample } from "../types.js";

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
