import { deepStrictEqual } from "assert";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { ConfigValidator } from "../../config/config-validator.js";
import { loadADLConfigInDir } from "../../config/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("adl: config file loading", () => {
  describe("file discovery", async () => {
    const scenarioRoot = resolve(__dirname, "../../../test/config/scenarios");
    const loadTestConfig = async (folderName: string) => {
      const folderPath = join(scenarioRoot, folderName);
      const { filename, ...config } = await loadADLConfigInDir(folderPath);
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

    it("loads from adl section in package.json config file", async () => {
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
      // Should load .adlrc.yaml and MOT load .adlrc.json here
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
    const validator = new ConfigValidator();

    it("does not allow additional properties", () => {
      deepStrictEqual(validator.validateConfig({ someCustomProp: true } as any), [
        {
          severity: "error",
          message:
            "Schema violation: must NOT have additional properties (/)\n  additionalProperty: someCustomProp",
        },
      ]);
    });

    it("fails if passing the wrong type", () => {
      deepStrictEqual(validator.validateConfig({ emitters: true } as any), [
        {
          severity: "error",
          message: "Schema violation: must be object (/emitters)",
        },
      ]);
    });

    it("succeeeds if config is valid", () => {
      deepStrictEqual(validator.validateConfig({ lint: { rules: { foo: "on" } } }), []);
    });
  });
});
