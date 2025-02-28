import { writeFile } from "fs/promises";

interface SeaConfig {
  readonly main: string;
  readonly output: string;
  readonly disableExperimentalSEAWarning?: boolean;
  readonly useCodeCache?: boolean;
}

export async function writeSeaConfig(path: string, config: SeaConfig) {
  await writeFile(path, JSON.stringify(config));
}
