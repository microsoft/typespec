import { PlaygroundLinks } from "../react/playground.js";
import { PlaygroundSample } from "../types.js";

type PlaygroundSampleConfig = Omit<PlaygroundSample, "content">;
export interface PlaygroundUserConfig extends Omit<PlaygroundConfig, "samples"> {
  /**
   * If the bundle library plugin should be loaded.
   */
  skipBundleLibraries?: boolean;
  samples: Record<string, PlaygroundSampleConfig>;
}

export interface PlaygroundConfig {
  defaultEmitter: string;
  libraries: string[];
  samples: Record<string, PlaygroundSample>;
  enableSwaggerUI: boolean;
  links?: PlaygroundLinks;
}
