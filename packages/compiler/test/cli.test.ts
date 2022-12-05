import { deepStrictEqual, strictEqual } from "assert";
import { dump } from "js-yaml";
import { CompileCliArgs, getCompilerOptions } from "../core/cli/args.js";
import {
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
  resolveVirtualPath,
  TestHost,
} from "../testing/index.js";

describe("compiler: cli", () => {
  let host: TestHost;

  const cwd = resolveVirtualPath("ws");

  beforeEach(async () => {
    host = await createTestHost();
    host.addCadlFile("ws/main.cadl", "");
  });

  describe("resolving compiler options", () => {
    async function resolveCompilerOptions(args: CompileCliArgs, env: Record<string, string> = {}) {
      const [options, diagnostics] = await getCompilerOptions(host.compilerHost, cwd, args, env);
      expectDiagnosticEmpty(diagnostics);
      return options;
    }

    it("no args and config: return empty options with output-dir at {cwd}/cadl-output", async () => {
      const options = await resolveCompilerOptions({});
      deepStrictEqual(options, {
        outputDir: `${cwd}/cadl-output`,
        options: {},
      });
    });

    it("--option without an emitter are moved to miscOptions", async () => {
      const options = await resolveCompilerOptions({
        options: [`test-debug=true`],
      });

      deepStrictEqual(options?.miscOptions, { "test-debug": "true" });
      deepStrictEqual(options?.options, {});
    });

    context("config file with emitters", () => {
      beforeEach(() => {
        host.addCadlFile(
          "ws/cadl-project.yaml",
          dump({
            parameters: {
              "custom-arg": {
                default: "/default-arg-value",
              },
            },
            emit: ["@cadl-lang/openapi3", "@cadl-lang/with-args"],
            options: {
              "@cadl-lang/openapi3": {
                "emitter-output-dir": "{output-dir}/custom",
              },
              "@cadl-lang/with-args": {
                "emitter-output-dir": "{custom-arg}/custom",
              },
            },
          })
        );
      });

      it("interpolate default output-dir in emitter output-dir", async () => {
        const options = await resolveCompilerOptions({});

        strictEqual(
          options?.options?.["@cadl-lang/openapi3"]?.["emitter-output-dir"],
          `${cwd}/cadl-output/custom`
        );
      });

      it("override output-dir from cli args", async () => {
        const options = await resolveCompilerOptions({ "output-dir": `${cwd}/my-output-dir` });

        strictEqual(
          options?.options?.["@cadl-lang/openapi3"]?.["emitter-output-dir"],
          `${cwd}/my-output-dir/custom`
        );
      });

      it("override emitter-output-dir from cli args", async () => {
        const options = await resolveCompilerOptions({
          options: [`@cadl-lang/openapi3.emitter-output-dir={cwd}/relative-to-cwd`],
        });

        strictEqual(
          options?.options?.["@cadl-lang/openapi3"]?.["emitter-output-dir"],
          `${cwd}/relative-to-cwd`
        );
      });

      describe("arg interpolation", () => {
        it("use default arg value", async () => {
          const options = await resolveCompilerOptions({});

          strictEqual(
            options?.options?.["@cadl-lang/with-args"]?.["emitter-output-dir"],
            `/default-arg-value/custom`
          );
        });

        it("passing --arg interpolate args in the cli", async () => {
          const options = await resolveCompilerOptions({
            args: [`custom-arg=/my-updated-arg-value`],
          });

          strictEqual(
            options?.options?.["@cadl-lang/with-args"]?.["emitter-output-dir"],
            `/my-updated-arg-value/custom`
          );
        });
      });

      it("emit diagnostic if passing unknown parameter", async () => {
        const [_, diagnostics] = await getCompilerOptions(
          host.compilerHost,
          cwd,
          {
            args: ["not-defined-arg=my-value"],
          },
          {}
        );

        expectDiagnostics(diagnostics, {
          code: "config-invalid-argument",
          message: `Argument "not-defined-arg" is not defined as a parameter in the config.`,
        });
      });

      it("emit diagnostic if using relative path in config paths", async () => {
        host.addCadlFile(
          "ws/cadl-project.yaml",
          dump({
            "output-dir": "./my-output",
          })
        );
        const [_, diagnostics] = await getCompilerOptions(host.compilerHost, cwd, {}, {});

        expectDiagnostics(diagnostics, {
          code: "config-path-absolute",
          message: `Path "./my-output" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
        });
      });
    });
  });
});
