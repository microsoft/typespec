import type { PlaygroundSample } from "../types.js";

/** Sample metadata whose source content will be read from `filename` by build tooling. */
export type PlaygroundSampleConfig = Omit<PlaygroundSample, "content">;
