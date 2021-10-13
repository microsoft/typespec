import { deepStrictEqual } from "assert";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { CadlConfigJsonSchema } from "../../config/config-schema.js";
import { CadlRawConfig, loadCadlConfigInDir } from "../../config/index.js";
import { createSourceFile } from "../../core/diagnostics.js";
import { SchemaValidator } from "../../core/schema-validator.js";
import { NodeHost } from "../../core/util.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("cadl: config file loading", () => {
  describe("file discovery", async () => {
    const scenarioRoot = resolve(__dirname, "../../../test/config/scenarios");
    const loadTestConfig = async (folderName: string) => {
      const folderPath = join(scenarioRoot, folderName);
      const { filename, ...config } = await loadCadlConfigInDir(NodeHost, folderPath);
      return config;
    };

    const assertLoadFromFolder = async (folderName: string) => {
      const config = await loadTestConfig(folderName);
      deepStrictEqual(config, {
        plugins: ["foo"],
        diagnostics: [],
        emitters: {
          "foo:openapi": true,
        },
        lint: {
          extends: [],
          rules: {
            "some-rule": "on",
          },
        },
      });
    };

    it("loads yaml config file", async () => {
      await assertLoadFromFolder("yaml");
    });

    it("loads json config file", async () => {
      await assertLoadFromFolder("json");
    });

    it("loads from cadl section in package.json config file", async () => {
      await assertLoadFromFolder("package-json");
    });

    it("loads empty config if it can't find any config files", async () => {
      const config = await loadTestConfig("empty");
      deepStrictEqual(config, {
        plugins: [],
        diagnostics: [],
        emitters: {},
        lint: {
          extends: [],
          rules: {},
        },
      });
    });

    it("only loads first config file found", async () => {
      // Should load .cadlrc.yaml and NOT load .cadlrc.json here
      await assertLoadFromFolder("yaml-json");
    });

    it("deep clones defaults when not found", async () => {
      let config = await loadTestConfig("empty");
      config.plugins.push("x");
      config.emitters["x"] = true;
      config.lint.extends.push("x");
      config.lint.rules["x"] = "off";

      config = await loadTestConfig("empty");
      deepStrictEqual(config, {
        plugins: [],
        diagnostics: [],
        emitters: {},
        lint: {
          extends: [],
          rules: {},
        },
      });
    });

    it("deep clones defaults when found", async () => {
      let config = await loadTestConfig("yaml");
      config.plugins.push("x");
      config.emitters["x"] = true;
      config.lint.extends.push("x");
      config.lint.rules["x"] = "off";

      config = await loadTestConfig("yaml");
      deepStrictEqual(config, {
        plugins: ["foo"],
        diagnostics: [],
        emitters: {
          "foo:openapi": true,
        },
        lint: {
          extends: [],
          rules: {
            "some-rule": "on",
          },
        },
      });
    });
  });

  describe("validation", () => {
    const validator = new SchemaValidator(CadlConfigJsonSchema);
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
      deepStrictEqual(validate({ lint: { rules: { foo: "on" } } }), []);
    });
  });
});
