import { deepStrictEqual, throws } from "assert";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { DiagnosticError } from "../../compiler/diagnostics.js";
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
      // load and mutate
      let config = await loadTestConfig("empty");
      config.plugins.push("x");
      config.emitters["x"] = true;
      config.lint.extends.push("x");
      config.lint.rules["x"] = "off";

      // reload and make sure mutation is not observed
      config = await loadTestConfig("empty");
      deepStrictEqual(config, {
        plugins: [],
        emitters: {},
        lint: {
          extends: [],
          rules: {},
        },
      });
    });

    it("deep clones defaults when found", async () => {
      // load and mutate
      let config = await loadTestConfig("yaml");
      config.plugins.push("x");
      config.emitters["x"] = true;
      config.lint.extends.push("x");
      config.lint.rules["x"] = "off";

      // reload and make sure mutation is not observed
      config = await loadTestConfig("yaml");
      deepStrictEqual(config, {
        plugins: ["foo"],
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
      throws(
        () => validator.validateConfig({ someCustomProp: true } as any),
        new DiagnosticError([
          {
            severity: "error",
            message:
              "Schema violation: must NOT have additional properties (/)\n  additionalProperty: someCustomProp",
          },
        ])
      );
    });

    it("fail if passing the wrong type", () => {
      throws(
        () => validator.validateConfig({ emitters: true } as any),
        new DiagnosticError([
          {
            severity: "error",
            message: "Schema violation: must be object (/emitters)",
          },
        ])
      );
    });

    it("succeeed if config is valid", () => {
      validator.validateConfig({ lint: { rules: { foo: "on" } } });
    });
  });
});
