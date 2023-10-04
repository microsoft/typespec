import { deepStrictEqual } from "assert";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { resolveCompilerOptions } from "../../src/config/index.js";
import { NodeHost } from "../../src/core/node-host.js";
import { normalizePath, resolvePath } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";

const scenarioRoot = resolvePath(
  dirname(fileURLToPath(import.meta.url)),
  "../../../test/config/scenarios"
);

describe("compiler: resolve compiler options", () => {
  const tspOutputPath = resolvePath(`${process.cwd()}/tsp-output`);
  describe("specifying explicit config file", () => {
    const resolveOptions = async (path: string) => {
      const fullPath = resolvePath(scenarioRoot, path);
      return await resolveCompilerOptions(NodeHost, {
        cwd: normalizePath(process.cwd()),
        entrypoint: fullPath, // not really used here
        configPath: fullPath,
      });
    };

    it("loads config at the given path", async () => {
      const [options, diagnostics] = await resolveOptions("custom/myConfig.yaml");
      expectDiagnosticEmpty(diagnostics);

      deepStrictEqual(options, {
        config: resolvePath(scenarioRoot, "custom/myConfig.yaml"),
        emit: ["openapi"],
        options: {},
        outputDir: tspOutputPath,
      });
    });

    it("emit diagnostics", async () => {
      const [_, diagnostics] = await resolveOptions("not-found.yaml");
      expectDiagnostics(diagnostics, {
        code: "config-path-not-found",
      });
    });
  });
});
