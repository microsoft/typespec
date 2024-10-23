import { deepStrictEqual, strictEqual } from "assert";
import { join } from "path";
import { describe, it } from "vitest";
import { TypeSpecConfigJsonSchema } from "../../src/config/config-schema.js";
import { TypeSpecRawConfig, loadTypeSpecConfigForPath } from "../../src/config/index.js";
import { NodeHost } from "../../src/core/node-host.js";
import { createJSONSchemaValidator } from "../../src/core/schema-validator.js";
import { createSourceFile } from "../../src/core/source-file.js";
import { resolvePath } from "../../src/index.js";
import { findTestPackageRoot } from "../../src/testing/test-utils.js";

const scenarioRoot = resolvePath(
  await findTestPackageRoot(import.meta.url),
  "test/config/scenarios",
);

describe("compiler: config file loading", () => {
  describe("file discovery", () => {
    const loadTestConfig = async (
      path: string,
      lookup: boolean = true,
      errorIfNotFound: boolean = true,
    ) => {
      const fullPath = join(scenarioRoot, path);
      const { filename, projectRoot, file, ...config } = await loadTypeSpecConfigForPath(
        NodeHost,
        fullPath,
        errorIfNotFound,
        lookup,
      );
      return config;
    };

    it("loads full path to custom config file", async () => {
      const lookup = false;
      const config = await loadTestConfig("custom/myConfig.yaml", lookup, true);
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
        emit: ["openapi"],
      });
    });

    it("loads 'tspconfig.yaml' if --config {folder} is supplied and tspconfig.yaml is present", async () => {
      const lookup = false;
      const config = await loadTestConfig("custom", lookup, true);
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
        emit: ["openapi"],
      });
    });

    it("emits diagnostic if --config {folder} is provided but 'tspconfig.yaml' is not found", async () => {
      const lookup = false;
      const config = await loadTestConfig("custom/otherfolder", lookup, true);
      strictEqual(config.diagnostics.length, 1);
      strictEqual(config.diagnostics[0].code, "config-path-not-found");
      strictEqual(config.diagnostics[0].severity, "error");
    });

    it("emits diagnostic for bad custom config file path", async () => {
      const lookup = true;
      const config = await loadTestConfig("custom/myConfigY.yaml", lookup, true);
      strictEqual(config.diagnostics.length, 1);
      strictEqual(config.diagnostics[0].code, "config-path-not-found");
      strictEqual(config.diagnostics[0].severity, "error");
    });

    it("emits diagnostic for invalid path", async () => {
      const lookup = false;
      const config = await loadTestConfig("invalid", lookup, true);
      strictEqual(config.diagnostics.length, 1);
      strictEqual(config.diagnostics[0].code, "config-path-not-found");
      strictEqual(config.diagnostics[0].severity, "error");
    });

    it("loads yaml config file", async () => {
      const config = await loadTestConfig("simple");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
        emit: ["openapi"],
      });
    });

    it("loads config file with extends", async () => {
      const config = await loadTestConfig("extends");
      deepStrictEqual(config, {
        diagnostics: [],
        extends: "./typespec-base.yaml",
        outputDir: "{cwd}/tsp-output",
        emit: ["openapi"],
      });
    });

    it("backcompat: loads old cadl-project.yaml config file if tspconfig.yaml not found", async () => {
      const config = await loadTestConfig("backcompat/cadl-project-only");
      deepStrictEqual(config, {
        diagnostics: [
          {
            code: "deprecated",
            message:
              "Deprecated: `cadl-project.yaml` is deprecated. Please rename to `tspconfig.yaml`.",
            severity: "warning",
            target: Symbol.for("NoTarget"),
          },
        ],
        outputDir: "{cwd}/tsp-output",
        emit: ["old-emitter"],
      });
    });

    it("backcompat: loads tspconfig.yaml even if cadl-project.yaml is found", async () => {
      const config = await loadTestConfig("backcompat/mixed");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
        emit: ["new-emitter"],
      });
    });

    it("loads empty config if it can't find any config files", async () => {
      const config = await loadTestConfig("empty", false, false);
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
      });
    });

    it("deep clones defaults when not found", async () => {
      let config = await loadTestConfig("empty", false, false);
      config = await loadTestConfig("empty", false, false);
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
      });
    });

    it("deep clones defaults when found", async () => {
      let config = await loadTestConfig("simple", false, false);

      config = await loadTestConfig("simple");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
        emit: ["openapi"],
      });
    });
  });

  describe("validation", () => {
    const validator = createJSONSchemaValidator(TypeSpecConfigJsonSchema);
    const file = createSourceFile("<content>", "<path>");

    function validate(data: TypeSpecRawConfig) {
      return validator.validate(data, file);
    }

    it("does not allow additional properties", () => {
      deepStrictEqual(validate({ someCustomProp: true } as any), [
        {
          code: "invalid-schema",
          target: { file, pos: 0, end: 0 },
          severity: "error",
          message:
            "Schema violation: must NOT have additional properties (/)\n  additionalProperty: someCustomProp",
        },
      ]);
    });

    it("fails if passing the wrong type", () => {
      deepStrictEqual(validate({ emitters: true } as any), [
        {
          code: "invalid-schema",
          target: { file, pos: 0, end: 0 },
          severity: "error",
          message: "Schema violation: must be object (/emitters)",
        },
      ]);
    });

    it("succeeds if config is valid", () => {
      deepStrictEqual(validate({ emitters: { openapi: {} } }), []);
    });
  });
});
