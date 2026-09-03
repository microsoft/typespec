import { writeFile } from "fs/promises";

interface SeaConfig {
  readonly main: string;
  /** Path of the single-executable to produce (`node --build-sea` writes the exe here). */
  readonly output: string;
  /** Base node binary to inject into. Defaults to the current node binary when omitted. */
  readonly executable?: string;
  readonly disableExperimentalSEAWarning?: boolean;
  readonly useCodeCache?: boolean;
  /** Map of asset key to the file path whose contents should be embedded in the executable. */
  readonly assets?: Readonly<Record<string, string>>;
}

export async function writeSeaConfig(path: string, config: SeaConfig) {
  await writeFile(path, JSON.stringify(config));
}
