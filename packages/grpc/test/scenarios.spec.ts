import assert from "assert";
import fs from "fs";
import path from "path";
import url from "url";

import micromatch from "micromatch";

import { CadlTestLibrary, createTestHost, resolveVirtualPath } from "@cadl-lang/compiler/testing";

const SCENARIOS_DIRECTORY = url.fileURLToPath(new url.URL("../../test/scenarios", import.meta.url));

const patternsToRecord = process.env.RECORD_SCENARIOS?.split(",") ?? [];

const CadlGrpcTestLibrary: CadlTestLibrary = {
  name: "@cadl-lang/grpc",
  packageRoot: path.resolve(url.fileURLToPath(import.meta.url), "../../../"),
  files: [
    { realDir: "", pattern: "package.json", virtualPath: "./node_modules/@cadl-lang/grpc" },
    {
      realDir: "dist/src",
      pattern: "*.js",
      virtualPath: "./node_modules/@cadl-lang/grpc/dist/src",
    },
  ],
};

describe("gRPC scenarios", function () {
  const scenarios = fs
    .readdirSync(SCENARIOS_DIRECTORY)
    .map((dn) => path.join(SCENARIOS_DIRECTORY, dn))
    .filter((dn) => fs.statSync(dn).isDirectory());

  for (const scenario of scenarios) {
    const scenarioName = path.basename(scenario);

    it(scenarioName, async function () {
      const inputFiles = await readdirRecursive(path.join(scenario, "input"));
      const outputFiles = await doEmit(inputFiles);

      const shouldRecord = micromatch.isMatch(scenarioName, patternsToRecord);

      const expectationDirectory = path.resolve(scenario, "output");

      if (shouldRecord) {
        // Write new output to the scenario's output folder.
        console.log("Should record :)");

        await fs.promises.rm(expectationDirectory, { recursive: true, force: true });

        await fs.promises.mkdir(expectationDirectory);

        for (const [fn, content] of Object.entries(outputFiles)) {
          const fullPath = path.join(expectationDirectory, fn);
          await fs.promises.writeFile(fullPath, content);
        }
      } else {
        // It's an error if any file in the expected files is missing, if any file in the output files doesn't have a
        // corresponding expectation, or if any file in the output files doesn't match its corresponding output file
        // character for character.
        const expectedFiles = await readdirRecursive(expectationDirectory);

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
    });
  }

  async function doEmit(files: Record<string, string>): Promise<Record<string, string>> {
    const baseOutputPath = resolveVirtualPath("test-output/");

    const host = await createTestHost({
      libraries: [CadlGrpcTestLibrary],
    });

    for (const [fileName, content] of Object.entries(files)) {
      host.addCadlFile(fileName, content);
    }

    await host.compile("main.cadl", {
      outputPath: baseOutputPath,
      noEmit: false,
      emitters: ["@cadl-lang/grpc"],
    });

    return Object.fromEntries(
      [...host.fs.entries()]
        .filter(([name]) => name.startsWith(baseOutputPath))
        .map(([name, value]) => [name.replace(baseOutputPath, ""), value])
    );
  }
});

// #region readdir recursive

async function readdirRecursive(dir: string, base: string = dir): Promise<Record<string, string>> {
  const res: Record<string, string> = {};

  for (const entry of (await fs.promises.readdir(dir)).map((e) => path.join(dir, e))) {
    const stat = await fs.promises.stat(entry);

    if (stat.isDirectory()) {
      for (const [name, content] of Object.entries(await readdirRecursive(entry, base))) {
        res[name] = content;
      }
    } else if (stat.isFile()) {
      const content = await (await fs.promises.readFile(entry)).toString("utf-8");

      res[path.relative(base, entry)] = content;
    } else {
      throw new Error("Unsupported file type.");
    }
  }

  return res;
}

// #endregion
