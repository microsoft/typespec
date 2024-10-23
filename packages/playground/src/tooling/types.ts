import type { PlaygroundSample } from "../types.js";

export type PlaygroundSampleConfig = Omit<PlaygroundSample, "content">;
