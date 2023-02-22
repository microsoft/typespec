import { deepStrictEqual } from "assert";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { TypeSpecConfigJsonSchema } from "../../config/config-schema.js";
import { loadTypeSpecConfigForPath, TypeSpecRawConfig } from "../../config/index.js";
import { createSourceFile } from "../../core/diagnostics.js";
import { NodeHost } from "../../core/node-host.js";
import { createJSONSchemaValidator } from "../../core/schema-validator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("compiler: config file loading", () => {
  describe("file discovery", () => {
    const scenarioRoot = resolve(__dirname, "../../../test/config/scenarios");
    const loadTestConfig = async (folderName: string) => {
      const folderPath = join(scenarioRoot, folderName);
      const { filename, projectRoot, ...config } = await loadTypeSpecConfigForPath(
        NodeHost,
        folderPath
      );
      return config;
    };

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
        outputDir: "{cwd}/typespec-output",
        emit: ["old-emitter"],
      });
    });

    it("backcompat: loads tspconfig.yaml even if cadl-project.yaml is found", async () => {
      const config = await loadTestConfig("backcompat/mixed");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/typespec-output",
        emit: ["new-emitter"],
      });
    });

    it("loads empty config if it can't find any config files", async () => {
      const config = await loadTestConfig("empty");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
      });
    });

    it("deep clones defaults when not found", async () => {
      let config = await loadTestConfig("empty");
      config = await loadTestConfig("empty");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/tsp-output",
      });
    });

    it("deep clones defaults when found", async () => {
      let config = await loadTestConfig("simple");

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
