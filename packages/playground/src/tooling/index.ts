import { getDirectoryPath } from "@typespec/compiler";
import { mkdir, readFile, writeFile } from "fs/promises";
import type { PlaygroundSample } from "../types.js";
import type { PlaygroundSampleConfig } from "./types.js";

/**
 * @experimental This API is experimental
 */
export async function buildSamples_experimental(
  rootDir: string,
  output: string,
  samples: Record<string, PlaygroundSampleConfig>,
) {
  const resolvedSamples: Record<string, PlaygroundSample> = {};

  for (const [name, config] of Object.entries(samples)) {
    const content = await readFile(`${rootDir}/${config.filename}`, "utf-8");

    resolvedSamples[name] = {
      filename: config.filename,
      content,
      preferredEmitter: config.preferredEmitter,
      compilerOptions: config.compilerOptions,
    };
  }

  const dir = getDirectoryPath(output);
  await mkdir(dir, { recursive: true });
  // await writeFile(output, content);

  const dts = [
    `import type { PlaygroundSample } from "@typespec/playground";`,
    `const samples: Record<string, PlaygroundSample> = ${JSON.stringify(resolvedSamples, null, 2)};`,
    `export default samples;`,
  ].join("\n");
  await writeFile(output, dts);
}
