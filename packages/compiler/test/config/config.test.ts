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

    it("backcompat: loads tspconfig.yaml", async () => {
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
      // eslint-disable-next-line no-useless-assignment
      let config = await loadTestConfig("empty", false, false);
      config = await loadTestConfig("empty", false, false);
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
      });
    });

    it("deep clones defaults when found", async () => {
      // eslint-disable-next-line no-useless-assignment
      let config = await loadTestConfig("simple", false, false);

      config = await loadTestConfig("simple");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
        emit: ["openapi"],
      });
    });
  });

  describe("project config", () => {
    const loadFullConfig = async (path: string, lookup: boolean = true) => {
      const fullPath = join(scenarioRoot, path);
      return loadTypeSpecConfigForPath(NodeHost, fullPath, false, lookup);
    };

    it("loads project: true shorthand", async () => {
      const config = await loadFullConfig("project-basic", false);
      strictEqual(config.diagnostics.length, 0);
      strictEqual(config.project !== undefined, true);
      strictEqual(config.project!.entrypoint.endsWith("main.tsp"), true);
      deepStrictEqual(config.emit, ["openapi"]);
    });

    it("loads project with explicit entrypoint", async () => {
      const config = await loadFullConfig("project-entrypoint", false);
      strictEqual(config.diagnostics.length, 0);
      strictEqual(config.project !== undefined, true);
      strictEqual(config.project!.entrypoint.endsWith("src/service.tsp"), true);
      deepStrictEqual(config.emit, ["openapi"]);
    });

    it("resolves entrypoint as absolute path relative to config directory", async () => {
      const config = await loadFullConfig("project-entrypoint", false);
      const expectedSuffix = join("project-entrypoint", "src", "service.tsp");
      strictEqual(config.project!.entrypoint.endsWith(expectedSuffix), true);
    });

    it("config without project field has no project property", async () => {
      const config = await loadFullConfig("simple", false);
      strictEqual(config.project, undefined);
    });

    it("loads nested project configs independently", async () => {
      const rootConfig = await loadFullConfig("project-nested", false);
      const nestedConfig = await loadFullConfig("project-nested/services/orders", false);

      strictEqual(rootConfig.project !== undefined, true);
      strictEqual(nestedConfig.project !== undefined, true);

      strictEqual(rootConfig.project!.entrypoint.endsWith("project-nested/main.tsp"), true);
      strictEqual(
        nestedConfig.project!.entrypoint.endsWith("services/orders/main.tsp"),
        true,
      );

      deepStrictEqual(rootConfig.emit, ["openapi"]);
      deepStrictEqual(nestedConfig.emit, ["@typespec/http-client-csharp"]);
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
      deepStrictEqual(validate({ emit: true } as any), [
        {
          code: "invalid-schema",
          target: { file, pos: 0, end: 0 },
          severity: "error",
          message: "Schema violation: must be array (/emit)",
        },
      ]);
    });

    it("succeeds if config is valid", () => {
      deepStrictEqual(validate({ options: { openapi: {} } }), []);
    });

    it("succeeds with project: true", () => {
      deepStrictEqual(validate({ project: true }), []);
    });

    it("succeeds with project object with entrypoint", () => {
      deepStrictEqual(validate({ project: { entrypoint: "src/main.tsp" } }), []);
    });

    it("succeeds with project object without entrypoint", () => {
      deepStrictEqual(validate({ project: {} }), []);
    });

    it("fails with project: false", () => {
      const diagnostics = validate({ project: false } as any);
      strictEqual(diagnostics.length > 0, true);
    });

    it("fails with project containing unknown properties", () => {
      const diagnostics = validate({ project: { unknown: "value" } } as any);
      strictEqual(diagnostics.length > 0, true);
    });
  });
});
