import {
  CompilerHost,
  NodeHost,
  compile,
  getDirectoryPath,
  joinPaths,
  resolveCompilerOptions,
  resolvePath,
} from "@typespec/compiler";
import { expectDiagnosticEmpty } from "@typespec/compiler/testing";
import { fail, ok, strictEqual } from "assert";
import { readdirSync } from "fs";
import { mkdir, readFile, readdir, writeFile } from "fs/promises";
import { fileURLToPath } from "url";

const shouldUpdateSnapshots = process.env.RECORD === "true";
const excludedSamples = [
  // fails compilation by design to demo language server
  "local-typespec",

  // no actual samples in these dirs
  "node_modules",
  "dist",
  "scratch",
  "scripts",
  "test",
  ".rush",
];

const samplesRoot = resolvePath(fileURLToPath(import.meta.url), "../../..");
const rootOutputDir = resolvePath(samplesRoot, "test/output");

describe("TypeSpec Samples", () => {
  const samples = resolveSamples(samplesRoot);

  samples.forEach((sample) => {
    it(sample.name, async () => {
      const outputs: Record<string, string> = {};
      const host: CompilerHost = {
        ...NodeHost,
        mkdirp: (path: string) => Promise.resolve(path),
        writeFile: async (path: string, content: string) => {
          if (path.startsWith("/out/")) {
            outputs[path.slice("/out/".length)] = content;
          }
        },
      };

      const [options, diagnostics] = await resolveCompilerOptions(host, {
        entrypoint: sample.entrypoint,
      });
      expectDiagnosticEmpty(diagnostics);

      const emit = options.emit;
      if (emit === undefined || emit.length === 0) {
        fail(
          `No emitters configured for sample "${sample.name}". Make sure the  config at: "${options.config}" is correct.`
        );
      }

      const program = await compile(host, sample.entrypoint, {
        ...options,
        outputDir: "/out/",
      });
      expectDiagnosticEmpty(program.diagnostics);

      const outputDir = resolvePath(rootOutputDir, sample.name);

      if (shouldUpdateSnapshots) {
        try {
          await host.rm(outputDir, { recursive: true });
        } catch (e) {}
        await host.mkdirp(outputDir);

        for (const [filename, content] of Object.entries(outputs)) {
          const snapshotPath = resolvePath(outputDir, filename);

          await mkdir(getDirectoryPath(snapshotPath), { recursive: true });
          await writeFile(snapshotPath, content);
        }
      } else {
        for (const [filename, content] of Object.entries(outputs)) {
          const snapshotPath = resolvePath(outputDir, filename);
          const existingContent = await readFile(snapshotPath);
          strictEqual(content, existingContent.toString());
        }

        for (const filename of await readFilesInDirRecursively(outputDir)) {
          ok(
            filename in outputs,
            `Snapshot for "${filename}" is missing. Run with RECORD=true to regenerate it.`
          );
        }
      }
    });
  });
});

async function readFilesInDirRecursively(dir: string): Promise<string[]> {
  const files = [];
  const entries = await readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      for (const file of await readFilesInDirRecursively(resolvePath(dir, entry.name))) {
        files.push(resolvePath(entry.name, file));
      }
    } else {
      files.push(entry.name);
    }
  }
  return files;
}

export interface Sample {
  name: string;
  /** Sample folder */
  fullPath: string;
  entrypoint: string;
}
export function resolveSamples(basedir: string): Sample[] {
  const samples: Sample[] = [];
  const excludes = new Set(excludedSamples);
  walk("");
  return samples;

  async function walk(relativeDir: string) {
    if (excludes.has(relativeDir)) {
      return;
    }
    const fullDir = joinPaths(basedir, relativeDir);
    for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(joinPaths(relativeDir, entry.name));
      } else if (relativeDir && entry.name === "main.tsp") {
        samples.push({
          name: relativeDir,
          fullPath: joinPaths(basedir, relativeDir),
          entrypoint: joinPaths(basedir, relativeDir, entry.name),
        });
      }
    }
  }
}
