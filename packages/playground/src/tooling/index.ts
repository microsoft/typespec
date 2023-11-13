import { getBaseFileName, getDirectoryPath, resolvePath } from "@typespec/compiler";
import { mkdir, readFile, writeFile } from "fs/promises";
import { PlaygroundSample } from "../types.js";
import { PlaygroundSampleConfig } from "./types.js";

/**
 * @experimental This API is experimental
 */
export async function buildSamples_experimental(
  rootDir: string,
  output: string,
  samples: Record<string, PlaygroundSampleConfig>
) {
  const resolvedSamples: Record<string, PlaygroundSample> = {};

  for (const [name, config] of Object.entries(samples)) {
    const content = await readFile(`${rootDir}/${config.filename}`, "utf-8");

    resolvedSamples[name] = {
      filename: config.filename,
      content,
      preferredEmitter: config.preferredEmitter,
    };
  }

  const content = `export default ${JSON.stringify(resolvedSamples, null, 2)};`;
  const dir = getDirectoryPath(output);
  await mkdir(dir, { recursive: true });
  await writeFile(output, content);

  const dts = [
    `import type { PlaygroundSample } from "@typespec/playground";`,
    `declare const samples: Record<string, PlaygroundSample>;`,
    `export default samples;`,
  ].join("\n");
  await writeFile(resolvePath(dir, getBaseFileName(output)) + ".d.ts", dts);
}
