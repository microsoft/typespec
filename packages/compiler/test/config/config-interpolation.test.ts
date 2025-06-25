import { deepStrictEqual } from "assert";
import { describe, it } from "vitest";
import {
  ExpandConfigOptions,
  expandConfigVariables,
  resolveValues,
} from "../../src/config/config-interpolation.js";
import { defaultConfig, validateConfigPathsAbsolute } from "../../src/config/config-loader.js";
import { TypeSpecConfig } from "../../src/config/types.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/index.js";

describe("compiler: config interpolation", () => {
  describe("resolveValues", () => {
    const commonVars = {
      "output-dir": "/test/output",
      env: {
        GITHUB_DIR: "/github",
      },
    };

    function expectResolveValues(values: Record<string, string>): Record<string, string> {
      const [resolved, diagnostics] = resolveValues(values, commonVars);
      expectDiagnosticEmpty(diagnostics);
      return resolved;
    }

    it("no-op if there is nothing to interpolate", () => {
      const resolved = expectResolveValues({
        one: "one",
        two: "two",
      });

      deepStrictEqual(resolved, {
        one: "one",
        two: "two",
      });
    });

    it("no-op if interpolate variable that doesn't exists", () => {
      const resolved = expectResolveValues({
        one: "{not-defined}/output",
      });

      deepStrictEqual(resolved, {
        one: "{not-defined}/output",
      });
    });

    it("interpolate variables from common vars", () => {
      const resolved = expectResolveValues({
        one: "{output-dir}/custom",
      });

      deepStrictEqual(resolved, {
        one: "/test/output/custom",
      });
    });

    it("interpolate variables from nested common vars", () => {
      const resolved = expectResolveValues({
        one: "{env.GITHUB_DIR}/custom",
      });

      deepStrictEqual(resolved, {
        one: "/github/custom",
      });
    });

    it("interpolate another variable", () => {
      const resolved = expectResolveValues({
        one: "{two}/one",
        two: "/two",
      });

      deepStrictEqual(resolved, {
        one: "/two/one",
        two: "/two",
      });
    });

    it("interpolate another variable also needing interpolation", () => {
      const resolved = expectResolveValues({
        three: "/three",
        one: "{two}/one",
        two: "{three}/two",
      });

      deepStrictEqual(resolved, {
        one: "/three/two/one",
        two: "/three/two",
        three: "/three",
      });
    });

    it("emit diagnostic if variable has circular references", () => {
      const [_, diagnostics] = resolveValues({
        three: "{one}/three",
        one: "{two}/one",
        two: "{three}/two",
      });

      expectDiagnostics(diagnostics, [
        {
          code: "config-circular-variable",
          message: `There is a circular reference to variable "three" in the cli configuration or arguments.`,
        },
        {
          code: "config-circular-variable",
          message: `There is a circular reference to variable "one" in the cli configuration or arguments.`,
        },
        {
          code: "config-circular-variable",
          message: `There is a circular reference to variable "two" in the cli configuration or arguments.`,
        },
      ]);
    });
    it("emit diagnostic if variable has circular references (nested)", () => {
      const [_, diagnostics] = resolveValues({
        one: "{nested.two}/three",
        nested: {
          two: "{one}/two",
        },
      });

      expectDiagnostics(diagnostics, [
        {
          code: "config-circular-variable",
          message: `There is a circular reference to variable "one" in the cli configuration or arguments.`,
        },
        {
          code: "config-circular-variable",
          message: `There is a circular reference to variable "nested.two" in the cli configuration or arguments.`,
        },
      ]);
    });
  });

  describe("expandConfigVariables", () => {
    function expectExpandConfigVariables(config: TypeSpecConfig, options: ExpandConfigOptions) {
      const [resolved, diagnostics] = expandConfigVariables(config, options);
      expectDiagnosticEmpty(diagnostics);
      return resolved;
    }

    it("expand {cwd}", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        outputDir: "{cwd}/my-output",
      };
      const resolved = expectExpandConfigVariables(config, { cwd: "/dev/wd" });
      deepStrictEqual(resolved, {
        ...config,
        outputDir: "/dev/wd/my-output",
      });
    });

    it("expand {project-root}", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        outputDir: "{project-root}/my-output",
      };
      const resolved = expectExpandConfigVariables(config, { cwd: "/dev/wd" });
      deepStrictEqual(resolved, {
        ...config,
        outputDir: "/dev/ws/my-output",
      });
    });

    it("use parameter with {output-dir} in emitter-output-dir", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        outputDir: "{project-root}/my-output",
        parameters: {
          "test-var": {
            default: "{output-dir}/test-var",
          },
        },
        options: {
          emitter1: {
            "emitter-output-dir": "{test-var}/emitter1",
          },
        },
      };
      const resolved = expectExpandConfigVariables(config, { cwd: "/dev/wd" });
      deepStrictEqual(resolved, {
        ...config,
        outputDir: "/dev/ws/my-output",
        options: {
          emitter1: {
            "emitter-output-dir": "/dev/ws/my-output/test-var/emitter1",
          },
        },
      });
    });

    describe("interpolating args", () => {
      const config: TypeSpecConfig = {
        ...defaultConfig,
        parameters: {
          "repo-dir": {
            default: "{cwd}",
          },
        },
        projectRoot: "/dev/ws",
        outputDir: "{repo-dir}/my-output",
      };

      it("expand args using default value if not provided", () => {
        const resolved = expectExpandConfigVariables(config, {
          cwd: "/dev/wd",
        });
        deepStrictEqual(resolved, {
          ...config,
          outputDir: "/dev/wd/my-output",
        });
      });

      it("expand args with value passed", () => {
        const resolved = expectExpandConfigVariables(config, {
          cwd: "/dev/wd",
          args: { "repo-dir": "/github-dir" },
        });
        deepStrictEqual(resolved, {
          ...config,
          outputDir: "/github-dir/my-output",
        });
      });

      it("expand predefined variables inside args passed", () => {
        const resolved = expectExpandConfigVariables(config, {
          cwd: "/dev/wd",
          args: { "repo-dir": "{cwd}/github-dir" },
        });
        deepStrictEqual(resolved, {
          ...config,
          outputDir: "/dev/wd/github-dir/my-output",
        });
      });
    });

    describe("interpolating env", () => {
      const config: TypeSpecConfig = {
        ...defaultConfig,
        environmentVariables: {
          REPO_DIR: {
            default: "{cwd}",
          },
        },
        projectRoot: "/dev/ws",
        outputDir: "{env.REPO_DIR}/my-output",
      };

      it("expand args using default value if not provided", () => {
        const resolved = expectExpandConfigVariables(config, {
          cwd: "/dev/wd",
        });
        deepStrictEqual(resolved, {
          ...config,
          outputDir: "/dev/wd/my-output",
        });
      });

      it("expand env with value passed", () => {
        const resolved = expectExpandConfigVariables(config, {
          cwd: "/dev/wd",
          env: { REPO_DIR: "/github-dir" },
        });
        deepStrictEqual(resolved, {
          ...config,
          outputDir: "/github-dir/my-output",
        });
      });
    });

    it("expand {output-dir} in emitter options", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        outputDir: "/my-custom-output-dir",
        options: {
          emitter1: {
            "emitter-output-dir": "{output-dir}/emitter1",
          },
        },
      };
      const resolved = expectExpandConfigVariables(config, { cwd: "/dev/wd" });
      deepStrictEqual(resolved, {
        ...config,
        options: {
          emitter1: {
            "emitter-output-dir": "/my-custom-output-dir/emitter1",
          },
        },
      });
    });

    it("emitter options can interpolate each other", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        outputDir: "/my-custom-output-dir",
        options: {
          emitter1: {
            "emitter-output-dir": "{output-dir}/{emitter-folder}",
            "emitter-folder": "custom-1",
          },
        },
      };
      const resolved = expectExpandConfigVariables(config, { cwd: "/dev/wd" });
      deepStrictEqual(resolved, {
        ...config,
        options: {
          emitter1: {
            "emitter-output-dir": "/my-custom-output-dir/custom-1",
            "emitter-folder": "custom-1",
          },
        },
      });
    });

    it("expand nested emitter options", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        options: {
          emitter1: {
            header: "By {by.owners.primary}",
            by: {
              owners: {
                primary: "none",
              },
            },
          },
        },
      };
      const resolved = expectExpandConfigVariables(config, { cwd: "/dev/ws" });
      deepStrictEqual(resolved, {
        ...config,
        outputDir: "/dev/ws/tsp-output",
        options: {
          ...config.options,
          emitter1: {
            ...config.options.emitter1,
            header: "By none",
          },
        },
      });
    });
  });

  describe("validateConfigPathsAbsolute", () => {
    it("emit diagnostic for using a relative path starting with ./", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        outputDir: "./my-output",
      };
      const diagnostics = validateConfigPathsAbsolute(config);
      expectDiagnostics(diagnostics, {
        code: "config-path-absolute",
        message: `Path "./my-output" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
      });
    });

    it("emit diagnostic for using a relative path starting with ../", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        outputDir: "../my-output",
      };
      const diagnostics = validateConfigPathsAbsolute(config);
      expectDiagnostics(diagnostics, {
        code: "config-path-absolute",
        message: `Path "../my-output" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
      });
    });

    it("emit diagnostic for using a relative path", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        outputDir: "my-output",
      };
      const diagnostics = validateConfigPathsAbsolute(config);
      expectDiagnostics(diagnostics, {
        code: "config-path-absolute",
        message: `Path "my-output" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
      });
    });

    it("succeed if using unix absolute path", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        outputDir: "/my-output",
      };
      const diagnostics = validateConfigPathsAbsolute(config);
      expectDiagnosticEmpty(diagnostics);
    });

    it("succeed if using windows absolute path", () => {
      const config = {
        ...defaultConfig,
        projectRoot: "/dev/ws",
        outputDir: "C:/my-output",
      };
      const diagnostics = validateConfigPathsAbsolute(config);
      expectDiagnosticEmpty(diagnostics);
    });
  });
});
