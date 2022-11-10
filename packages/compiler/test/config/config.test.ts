import { deepStrictEqual } from "assert";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { CadlConfigJsonSchema } from "../../config/config-schema.js";
import { CadlRawConfig, loadCadlConfigForPath } from "../../config/index.js";
import { createSourceFile } from "../../core/diagnostics.js";
import { NodeHost } from "../../core/node-host.js";
import { createJSONSchemaValidator } from "../../core/schema-validator.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("compiler: config file loading", () => {
  describe("file discovery", () => {
    const scenarioRoot = resolve(__dirname, "../../../test/config/scenarios");
    const loadTestConfig = async (folderName: string) => {
      const folderPath = join(scenarioRoot, folderName);
      const { filename, projectRoot, ...config } = await loadCadlConfigForPath(
        NodeHost,
        folderPath
      );
      return config;
    };

    it("loads yaml config file", async () => {
      const config = await loadTestConfig("simple");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/cadl-output",
        emitters: { openapi: {} },
      });
    });

    it("loads config file with extends", async () => {
      const config = await loadTestConfig("extends");
      deepStrictEqual(config, {
        diagnostics: [],
        extends: "./cadl-base.yaml",
        outputDir: "{cwd}/cadl-output",
        emitters: { openapi: {} },
      });
    });

    it("loads empty config if it can't find any config files", async () => {
      const config = await loadTestConfig("empty");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/cadl-output",
        emitters: {},
      });
    });

    it("deep clones defaults when not found", async () => {
      let config = await loadTestConfig("empty");
      config.emitters["x"] = {};

      config = await loadTestConfig("empty");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/cadl-output",
        emitters: {},
      });
    });

    it("deep clones defaults when found", async () => {
      let config = await loadTestConfig("simple");
      config.emitters["x"] = {};

      config = await loadTestConfig("simple");
      deepStrictEqual(config, {
        diagnostics: [],
        outputDir: "{cwd}/cadl-output",
        emitters: {
          openapi: {},
        },
      });
    });
  });

  describe("validation", () => {
    const validator = createJSONSchemaValidator(CadlConfigJsonSchema);
    const file = createSourceFile("<content>", "<path>");

    function validate(data: CadlRawConfig) {
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
