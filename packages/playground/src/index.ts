export interface PlaygroundConfig {
  defaultEmitter: string;
  libraries: string[];
  samples: Record<string, SampleConfig>;
  enableSwaggerUI: boolean;
  links: {
    newIssue: string;
    documentation: string;
  };
}

export interface SampleConfig {
  fileName: string;
  preferredEmitter?: string;
  content?: string;
}

export { createBrowserHost } from "./browser-host.js";
