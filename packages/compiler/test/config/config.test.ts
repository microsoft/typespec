import { deepStrictEqual, strictEqual } from "assert";
import { join } from "path";
import { describe, it } from "vitest";
import { TypeSpecConfigJsonSchema } from "../../src/config/config-schema.js";
import { TypeSpecRawConfig, loadTypeSpecConfigForPath } from "../../src/config/index.js";
import { NodeHost } from "../../src/core/node-host.js";
import { createJSONSchemaValidator } from "../../src/core/schema-validator.js";
import { createSourceFile } from "../../src/core/source-file.js";
import { resolvePath } from "../../src/index.js";
import { createTestFileSystem } from "../../src/testing/fs.js";
import { findTestPackageRoot, resolveVirtualPath } from "../../src/testing/test-utils.js";

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

    it("loads config with kind: project", async () => {
      const config = await loadTestConfig("project-basic");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
        kind: "project",
        emit: ["openapi"],
      });
    });

    it("loads config with kind: project and entrypoint", async () => {
      const config = await loadTestConfig("project-entrypoint");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
        kind: "project",
        entrypoint: "src/service.tsp",
        emit: ["openapi"],
      });
    });

    it("loads config with kind: project and features", async () => {
      const config = await loadTestConfig("project-features");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
        kind: "project",
        features: ["function-declarations"],
      });
    });

    it("loads config with kind: project and blank features", async () => {
      const fs = createTestFileSystem();
      fs.addTypeSpecFile(
        "project/tspconfig.yaml",
        `
        kind: project
        features:
        `,
      );

      const { filename, projectRoot, file, ...config } = await loadTypeSpecConfigForPath(
        fs.compilerHost,
        resolveVirtualPath("project/tspconfig.yaml"),
        true,
        false,
      );
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
        kind: "project",
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

    it("succeeds with kind: project", () => {
      deepStrictEqual(validate({ kind: "project" }), []);
    });

    it("succeeds with kind: project and entrypoint", () => {
      deepStrictEqual(validate({ kind: "project", entrypoint: "src/service.tsp" }), []);
    });

    it("succeeds with kind: project and features", () => {
      deepStrictEqual(validate({ kind: "project", features: ["function-declarations"] }), []);
    });

    it("fails with non-string features", () => {
      const diagnostics = validate({ kind: "project", features: [123] } as any);
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].code, "invalid-schema");
    });

    it("fails with invalid kind value", () => {
      const diagnostics = validate({ kind: "invalid" } as any);
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].code, "invalid-schema");
    });

    it("fails with non-string entrypoint", () => {
      const diagnostics = validate({ entrypoint: 123 } as any);
      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].code, "invalid-schema");
    });
  });

  describe("project config validation", () => {
    it("errors when kind: project is used in a non-tspconfig.yaml file", async () => {
      const fullPath = join(scenarioRoot, "project-custom-name/my-config.yaml");
      const config = await loadTypeSpecConfigForPath(NodeHost, fullPath, true, false);
      strictEqual(config.diagnostics.length, 1);
      strictEqual(config.diagnostics[0].code, "config-project-kind-filename");
    });

    it("errors when entrypoint is used without kind: project", async () => {
      const config = await loadTestConfigFile("entrypoint-no-project");
      strictEqual(config.diagnostics.length, 1);
      strictEqual(config.diagnostics[0].code, "config-project-only-option");
    });

    it("errors when features is used without kind: project", async () => {
      const config = await loadTestConfigFile("features-no-project");
      strictEqual(config.diagnostics.length, 1);
      strictEqual(config.diagnostics[0].code, "config-project-only-option");
    });

    it("errors when project config references unknown features", async () => {
      const config = await loadTestConfigFile("project-unknown-feature");
      strictEqual(config.diagnostics.length, 1);
      strictEqual(config.diagnostics[0].code, "config-unknown-feature");
    });

    it("allows kind: project in tspconfig.yaml", async () => {
      const config = await loadTestConfigFile("project-basic");
      strictEqual(config.diagnostics.length, 0);
      strictEqual(config.kind, "project");
    });
  });
});

async function loadTestConfigFile(scenarioName: string) {
  const fullPath = join(scenarioRoot, scenarioName, "tspconfig.yaml");
  return loadTypeSpecConfigForPath(NodeHost, fullPath, true, false);
}
