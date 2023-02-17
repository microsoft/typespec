import assert from "assert";
import fs from "fs";
import path from "path";
import url from "url";

import micromatch from "micromatch";

import { formatDiagnostic } from "@cadl-lang/compiler";
import { CadlTestLibrary, createTestHost, resolveVirtualPath } from "@cadl-lang/compiler/testing";

const SCENARIOS_DIRECTORY = url.fileURLToPath(new url.URL("../../test/scenarios", import.meta.url));

const shouldRecord = process.env.RECORD === "true";
const patternsToRun = process.env.RUN_SCENARIOS?.split(",") ?? ["*"];

const CadlProtobufTestLibrary: CadlTestLibrary = {
  name: "@cadl-lang/protobuf",
  packageRoot: path.resolve(url.fileURLToPath(import.meta.url), "../../../"),
  files: [
    { realDir: "", pattern: "package.json", virtualPath: "./node_modules/@cadl-lang/protobuf" },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@cadl-lang/protobuf/dist/src",
    },
    { realDir: "lib/", pattern: "*.cadl", virtualPath: "./node_modules/@cadl-lang/protobuf/lib" },
  ],
};

describe("protobuf scenarios", function () {
  const scenarios = fs
    .readdirSync(SCENARIOS_DIRECTORY)
    .map((dn) => path.join(SCENARIOS_DIRECTORY, dn))
    .filter((dn) => fs.statSync(dn).isDirectory());

  for (const scenario of scenarios) {
    const scenarioName = path.basename(scenario);

    const shouldRun = micromatch.isMatch(scenarioName, patternsToRun);

    shouldRun &&
      it(scenarioName, async function () {
        const inputFiles = await readdirRecursive(path.join(scenario, "input"));
        const emitResult = await doEmit(inputFiles);

        const expectationDirectory = path.resolve(scenario, "output");
        const diagnosticsExpectationPath = path.resolve(scenario, "diagnostics.txt");

        if (shouldRecord) {
          // Write new output to the scenario's output folder.

          await writeExpectationDirectory(expectationDirectory, emitResult.files);

          await fs.promises.rm(diagnosticsExpectationPath, { force: true });

          if (emitResult.diagnostics.length > 0) {
            const diagnostics = emitResult.diagnostics.join("\n");

            await fs.promises.writeFile(diagnosticsExpectationPath, diagnostics);
          }
        } else {
          // It's an error if any file in the expected files is missing, if any file in the output files doesn't have a
          // corresponding expectation, or if any file in the output files doesn't match its corresponding output file
          // character for character.

          let err: Error | undefined = undefined;

          // `throwIfNoEntry` is not supported with promisified fs.promises.stat.
          if (!fs.statSync(expectationDirectory, { throwIfNoEntry: false })) {
            assert.strictEqual(
              Object.entries(emitResult.files).length,
              0,
              "no expectations exist, but output files were generated"
            );
          } else {
            const expectedFiles = await readdirRecursive(expectationDirectory);

            // Need to defer this error until we've checked for diagnostics below. If diagnostics were unexpectedly
            // raised and inhibited emit, that should be the primary error, not this one.
            try {
              assertFilesAsExpected(emitResult.files, expectedFiles);
            } catch (e: unknown) {
              err = e as Error;
            }
          }

          let expectedDiagnostics: string;
          try {
            expectedDiagnostics = (await fs.promises.readFile(diagnosticsExpectationPath)).toString(
              "utf-8"
            );
          } catch {
            expectedDiagnostics = "";
          }

          const diagnostics = emitResult.diagnostics.join("\n");

          assert.strictEqual(diagnostics, expectedDiagnostics, "expected equivalent diagnostics");

          if (err) throw err;
        }
      });
  }
});

interface EmitResult {
  files: Record<string, string>;
  diagnostics: string[];
}

async function doEmit(files: Record<string, string>): Promise<EmitResult> {
  const baseOutputPath = resolveVirtualPath("test-output/");

  const host = await createTestHost({
    libraries: [CadlProtobufTestLibrary],
  });

  for (const [fileName, content] of Object.entries(files)) {
    host.addCadlFile(fileName, content);
  }

  const [, diagnostics] = await host.compileAndDiagnose("main.cadl", {
    outputDir: baseOutputPath,
    noEmit: false,
    emitters: {
      "@cadl-lang/protobuf": {},
    },
  });

  return {
    files: Object.fromEntries(
      [...host.fs.entries()]
        .filter(([name]) => name.startsWith(baseOutputPath))
        .map(([name, value]) => [name.replace(baseOutputPath, ""), value])
    ),
    diagnostics: diagnostics.map(formatDiagnostic),
  };
}

function assertFilesAsExpected(
  outputFiles: Record<string, string>,
  expectedFiles: Record<string, string>
) {
  for (const fn of Object.keys(expectedFiles)) {
    assert.ok(
      Object.prototype.hasOwnProperty.call(outputFiles, fn),
      `expected file ${fn} was not produced`
    );
  }

  for (const [fn, content] of Object.entries(outputFiles)) {
    const expectedContent = expectedFiles[fn];

    assert.ok(expectedContent, `output file ${fn} has no corresponding expectation`);

    assert.strictEqual(content, expectedContent);
  }
}

async function writeExpectationDirectory(
  expectationDirectory: string,
  outputFiles: Record<string, string>
) {
  const fileEntries = Object.entries(outputFiles);

  // It'll be annoying to fiddle with .gitkeep files, so let's omit the `output` directory if it's empty.
  if (fileEntries.length === 0) {
    return;
  }

  await fs.promises.rm(expectationDirectory, { recursive: true, force: true });

  await fs.promises.mkdir(expectationDirectory);

  for (const [fn, content] of fileEntries) {
    const fullPath = path.join(expectationDirectory, fn);
    await fs.promises.mkdir(path.dirname(fullPath), { recursive: true });
    await fs.promises.writeFile(fullPath, content);
  }
}

async function readdirRecursive(dir: string, base: string = dir): Promise<Record<string, string>> {
  const res: Record<string, string> = {};

  for (const entry of (await fs.promises.readdir(dir)).map((e) => path.join(dir, e))) {
    const stat = await fs.promises.stat(entry);

    if (stat.isDirectory()) {
      for (const [name, content] of Object.entries(await readdirRecursive(entry, base))) {
        res[name] = content;
      }
    } else if (stat.isFile()) {
      const content = (await fs.promises.readFile(entry)).toString("utf-8");

      res[path.relative(base, entry)] = content;
    } else {
      throw new Error("Unsupported file type.");
    }
  }

  return res;
}
