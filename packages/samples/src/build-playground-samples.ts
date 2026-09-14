import { NodeHost, resolveCompilerOptions, type CompilerOptions } from "@typespec/compiler";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, relative, resolve, sep } from "node:path";
import { loadSampleCatalog } from "./sample-config.js";

export interface BuildPlaygroundSamplesOptions {
  /** Directory containing the canonical sample tree. */
  specsDir: string;

  /** Generated TypeScript module path. */
  outputFile: string;

  /** Directory used to make sample filenames relative for the consuming application. */
  relativeTo: string;

  /** Emitter used when a sample has no inherited emitter configuration. */
  defaultEmitter?: string;
}

export interface PlaygroundSampleData {
  filename: string;
  preferredEmitter: string;
  content: string;
  description: string;
  category?: string;
  compilerOptions?: CompilerOptions;
}

/**
 * Build the sample module consumed by a TypeSpec playground.
 */
export async function buildPlaygroundSamples(
  options: BuildPlaygroundSamplesOptions,
): Promise<Record<string, PlaygroundSampleData>> {
  const specsDir = resolve(options.specsDir);
  const catalog = await loadSampleCatalog(specsDir);
  const samples: Record<string, PlaygroundSampleData> = {};

  for (const entry of catalog.samples.filter((x) => x.playground)) {
    const mainFile = resolve(entry.directory, "main.tsp");
    if (entry.tspFiles.length !== 1 || entry.tspFiles[0] !== mainFile) {
      throw new Error(
        `Playground sample "${entry.id}" must contain exactly one TypeSpec file named main.tsp. ` +
          `Set playground: false for multi-file samples.`,
      );
    }

    const [resolvedOptions, diagnostics] = await resolveCompilerOptions(NodeHost, {
      cwd: entry.directory,
      entrypoint: mainFile,
    });
    if (diagnostics.length > 0) {
      throw new Error(
        `Failed to resolve compiler options for playground sample "${entry.id}":\n${diagnostics
          .map((x) => x.message)
          .join("\n")}`,
      );
    }

    const preferredEmitter = resolvedOptions.emit?.[0] ?? options.defaultEmitter;
    if (!preferredEmitter) {
      throw new Error(
        `Playground sample "${entry.id}" has no emitter. Configure one in tspconfig.yaml or provide defaultEmitter.`,
      );
    }

    const compilerOptions = resolvedOptions.linterRuleSet
      ? { linterRuleSet: resolvedOptions.linterRuleSet }
      : undefined;

    samples[entry.config.title] = {
      filename: toPosix(relative(resolve(options.relativeTo), mainFile)),
      content: await readFile(mainFile, "utf-8"),
      preferredEmitter,
      description: entry.config.description,
      category: entry.category?.label,
      ...(compilerOptions ? { compilerOptions } : {}),
    };
  }

  const output = [
    `import type { PlaygroundSample } from "@typespec/playground";`,
    `const samples: Record<string, PlaygroundSample> = ${JSON.stringify(samples, null, 2)};`,
    `export default samples;`,
  ].join("\n");
  const outputFile = resolve(options.outputFile);
  await mkdir(dirname(outputFile), { recursive: true });
  await writeFile(outputFile, output);
  return samples;
}

function toPosix(path: string): string {
  return path.split(sep).join("/");
}
