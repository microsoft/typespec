import {
  CompilerHost,
  NodeHost,
  ResolveCompilerOptionsOptions,
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

const shouldUpdateSnapshots = process.env.RECORD === "true";

export interface SampleSnapshotTestOptions {
  /**  Sample root directory. */
  sampleDir: string;

  /** Output directory for snapshots. */
  outputDir: string;

  /** Folders to exclude from testing. */
  exclude?: string[];

  /** Override the emitters to use. */
  emit?: string[];
}

export function defineSampleSnaphotTests(config: SampleSnapshotTestOptions) {
  resolveSamples(config).forEach((samples) => defineSampleSnaphotTest(config, samples));
}

function defineSampleSnaphotTest(config: SampleSnapshotTestOptions, sample: Sample) {
  it(sample.name, async () => {
    const host = createSampleSnapshotTestHost(config);

    const overrides: Partial<ResolveCompilerOptionsOptions["overrides"]> = {
      outputDir: "/out",
    };
    if (config.emit) {
      overrides.emit = config.emit;
    }
    const [options, diagnostics] = await resolveCompilerOptions(host, {
      entrypoint: sample.fullPath,
      overrides,
    });
    expectDiagnosticEmpty(diagnostics);

    const emit = options.emit;
    if (emit === undefined || emit.length === 0) {
      fail(
        `No emitters configured for sample "${sample.name}". Make sure the  config at: "${options.config}" is correct.`
      );
    }

    const program = await compile(host, sample.fullPath, options);
    expectDiagnosticEmpty(program.diagnostics);

    const outputDir = resolvePath(config.outputDir, sample.name);

    if (shouldUpdateSnapshots) {
      try {
        await host.rm(outputDir, { recursive: true });
      } catch (e) {}
      await mkdir(outputDir, { recursive: true });

      for (const [filename, content] of host.outputs.entries()) {
        const snapshotPath = resolvePath(outputDir, filename);

        try {
          await mkdir(getDirectoryPath(snapshotPath), { recursive: true });
          await writeFile(snapshotPath, content);
        } catch (e) {
          throw new Error(`Failure to write snapshot: "${snapshotPath}"\n Error: ${e}`);
        }
      }
    } else {
      for (const [filename, content] of host.outputs.entries()) {
        const snapshotPath = resolvePath(outputDir, filename);
        let existingContent;
        try {
          existingContent = await readFile(snapshotPath);
        } catch (e: unknown) {
          if (typeof e === "object" && e !== null && "code" in e && e.code === "ENOENT") {
            fail(`Snapshot "${snapshotPath}" is missing. Run with RECORD=true to regenerate it.`);
          }
          throw e;
        }
        strictEqual(content, existingContent.toString());
      }

      for (const filename of await readFilesInDirRecursively(outputDir)) {
        ok(
          host.outputs.has(filename),
          `Snapshot for "${resolvePath(
            outputDir,
            filename
          )}" is missing. Run with RECORD=true to regenerate it.`
        );
      }
    }
  });
}

interface SampleSnapshotTestHost extends CompilerHost {
  outputs: Map<string, string>;
}
function createSampleSnapshotTestHost(config: SampleSnapshotTestOptions): SampleSnapshotTestHost {
  const outputs = new Map<string, string>();
  return {
    ...NodeHost,
    outputs,
    mkdirp: (path: string) => Promise.resolve(path),
    writeFile: async (path: string, content: string) => {
      if (path.startsWith("/out/")) {
        outputs.set(path.slice("/out/".length), content);
      }
    },
  };
}
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

interface Sample {
  name: string;
  /** Sample folder */
  fullPath: string;
}

function resolveSamples(config: SampleSnapshotTestOptions): Sample[] {
  const samples: Sample[] = [];
  const excludes = new Set(config.exclude);
  walk("");
  return samples;

  async function walk(relativeDir: string) {
    if (excludes.has(relativeDir)) {
      return;
    }
    const fullDir = joinPaths(config.sampleDir, relativeDir);
    for (const entry of readdirSync(fullDir, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        walk(joinPaths(relativeDir, entry.name));
      } else if (relativeDir && (entry.name === "main.tsp" || entry.name === "package.json")) {
        samples.push({
          name: relativeDir,
          fullPath: joinPaths(config.sampleDir, relativeDir),
        });
      }
    }
  }
}
