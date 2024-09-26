import { describe, it } from "vitest";
import { defaultConfig } from "../../src/config/config-loader.js";
import { resolveOptionsFromConfig } from "../../src/config/config-to-options.js";
import { TypeSpecConfig } from "../../src/config/types.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/index.js";

describe("validateConfigNames", () => {
  it("should return diagnostics for invalid parameter names", () => {
    const config: TypeSpecConfig = {
      ...defaultConfig,
      parameters: {
        "test.name": { default: "test" },
      },
      projectRoot: "",
    };

    const diagnostics = resolveOptionsFromConfig(config, { cwd: "" })[1];
    expectDiagnostics(diagnostics, {
      code: "config-invalid-name",
      message: `The configuration name "test.name" is invalid because it contains a dot ("."). Configuration names should not include dots to avoid potential conflicts and parsing issues.`,
    });
  });

  it("should return diagnostics for invalid option names", () => {
    const config: TypeSpecConfig = {
      ...defaultConfig,
      options: {
        "option.test.name": {},
      },
      projectRoot: "",
    };

    const diagnostics = resolveOptionsFromConfig(config, { cwd: "" })[1];
    expectDiagnostics(diagnostics, {
      code: "config-invalid-name",
      message: `The configuration name "option.test.name" is invalid because it contains a dot ("."). Configuration names should not include dots to avoid potential conflicts and parsing issues.`,
    });
  });

  it("should return diagnostics for invalid nested option names", () => {
    const config: TypeSpecConfig = {
      ...defaultConfig,
      options: {
        first: {
          "nested.name": {},
        },
      },
      projectRoot: "",
    };

    const diagnostics = resolveOptionsFromConfig(config, { cwd: "" })[1];
    expectDiagnostics(diagnostics, {
      code: "config-invalid-name",
      message: `The configuration name "nested.name" is invalid because it contains a dot ("."). Configuration names should not include dots to avoid potential conflicts and parsing issues.`,
    });
  });

  it("should handle empty configurations", () => {
    const config: TypeSpecConfig = {
      ...defaultConfig,
      parameters: {
        initial: { default: "value" },
      },
      options: {
        first: {
          nested: {},
        },
      },
      projectRoot: "",
    };

    const diagnostics = resolveOptionsFromConfig(config, { cwd: "" })[1];

    expectDiagnosticEmpty(diagnostics);
  });
});
