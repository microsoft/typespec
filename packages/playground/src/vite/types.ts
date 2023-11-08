import { PlaygroundLinks } from "../react/playground.js";
import { PlaygroundSampleConfig } from "../tooling/types.js";
import { PlaygroundSample } from "../types.js";

export interface PlaygroundUserConfig extends Omit<PlaygroundConfig, "samples"> {
  /**
   * If the bundle library plugin should be loaded.
   */
  skipBundleLibraries?: boolean;
  samples?: Record<string, PlaygroundSampleConfig>;
}

export interface PlaygroundConfig {
  defaultEmitter: string;
  libraries: string[];
  samples: Record<string, PlaygroundSample>;
  enableSwaggerUI: boolean;
  links?: PlaygroundLinks;
}
