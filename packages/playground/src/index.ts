export interface PlaygroundConfig {
  defaultEmitter: string;
  libraries: string[];
  samples: Record<string, string>;
  enableSwaggerUI: boolean;
}

export { createBrowserHost } from "./browser-host.js";
export { Playground, PlaygroundProps } from "./components/playground.js";
