import { deepStrictEqual, throws } from "assert";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";
import { DiagnosticError } from "../../compiler/diagnostics.js";
import { ConfigValidator } from "../../config/config-validator.js";
import { loadADLConfigInDir } from "../../config/index.js";

const __dirname = dirname(fileURLToPath(import.meta.url));

describe("adl: Config file loading", () => {
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
          rules: {},
        },
      });
    };

    it("Loads yaml config file", async () => {
      await assertLoadFromFolder("yaml");
    });

    it("Loads json config file", async () => {
      await assertLoadFromFolder("json");
    });

    it("Loads from adl section in package.json config file", async () => {
      await assertLoadFromFolder("package-json");
    });

    it("Loads empty config if it can't find any config files", async () => {
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
