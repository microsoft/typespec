import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { stringify } from "yaml";
import { TypeSpecRawConfig } from "../src/config/types.js";
import { CompileCliArgs, getCompilerOptions } from "../src/core/cli/actions/compile/args.js";
import { CompilerOptions } from "../src/core/options.js";
import {
  TestHost,
  createTestHost,
  expectDiagnosticEmpty,
  expectDiagnostics,
  resolveVirtualPath,
} from "../src/testing/index.js";

describe("compiler: cli", () => {
  let host: TestHost;

  const cwd = resolveVirtualPath("ws");

  beforeEach(async () => {
    host = await createTestHost();
    host.addTypeSpecFile("ws/main.tsp", "");
  });

  describe("resolving compiler options", () => {
    async function resolveCompilerOptions(args: CompileCliArgs, env: Record<string, string> = {}) {
      const [options, diagnostics] = await getCompilerOptions(
        host.compilerHost,
        "ws/main.tsp",
        cwd,
        args,
        env,
      );
      expectDiagnosticEmpty(diagnostics);
      ok(options, "Options should have been set.");
      const { configFile: config, ...rest } = options;
      return rest;
    }

    it("no args and config: return empty options with output-dir at {cwd}/tsp-output", async () => {
      const options = await resolveCompilerOptions({});
      deepStrictEqual(options, {
        outputDir: `${cwd}/tsp-output`,
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

    describe("config file with emitters", () => {
      beforeEach(() => {
        host.addTypeSpecFile(
          "ws/tspconfig.yaml",
          stringify({
            parameters: {
              "custom-arg": {
                default: "/default-arg-value",
              },
            },
            emit: ["@typespec/openapi3", "@typespec/with-args"],
            options: {
              "@typespec/openapi3": {
                "emitter-output-dir": "{output-dir}/custom",
              },
              "@typespec/with-args": {
                "emitter-output-dir": "{custom-arg}/custom",
              },
            },
          }),
        );
      });

      it("interpolate default output-dir in emitter output-dir", async () => {
        const options = await resolveCompilerOptions({});

        strictEqual(
          options?.options?.["@typespec/openapi3"]?.["emitter-output-dir"],
          `${cwd}/tsp-output/custom`,
        );
      });

      it("override output-dir from cli args", async () => {
        const options = await resolveCompilerOptions({ "output-dir": `${cwd}/my-output-dir` });

        strictEqual(
          options?.options?.["@typespec/openapi3"]?.["emitter-output-dir"],
          `${cwd}/my-output-dir/custom`,
        );
      });

      it("override emitter-output-dir from cli args", async () => {
        const options = await resolveCompilerOptions({
          options: [`@typespec/openapi3.emitter-output-dir={cwd}/relative-to-cwd`],
        });

        strictEqual(
          options?.options?.["@typespec/openapi3"]?.["emitter-output-dir"],
          `${cwd}/relative-to-cwd`,
        );
      });

      it("override emitter-output-dir from cli args using path to emitter with extension", async () => {
        const options = await resolveCompilerOptions({
          options: [`path/to/emitter.js.emitter-output-dir={cwd}/relative-to-cwd`],
        });

        strictEqual(
          options?.options?.["path/to/emitter.js"]?.["emitter-output-dir"],
          `${cwd}/relative-to-cwd`,
        );
      });

      describe("arg interpolation", () => {
        it("use default arg value", async () => {
          const options = await resolveCompilerOptions({});

          strictEqual(
            options?.options?.["@typespec/with-args"]?.["emitter-output-dir"],
            `/default-arg-value/custom`,
          );
        });

        it("passing --arg interpolate args in the cli", async () => {
          const options = await resolveCompilerOptions({
            args: [`custom-arg=/my-updated-arg-value`],
          });

          strictEqual(
            options?.options?.["@typespec/with-args"]?.["emitter-output-dir"],
            `/my-updated-arg-value/custom`,
          );
        });
      });

      it("emit diagnostic if passing unknown parameter", async () => {
        const [_, diagnostics] = await getCompilerOptions(
          host.compilerHost,
          "ws/main.tsp",
          cwd,
          {
            args: ["not-defined-arg=my-value"],
          },
          {},
        );

        expectDiagnostics(diagnostics, {
          code: "config-invalid-argument",
          message: `Argument "not-defined-arg" is not defined as a parameter in the config.`,
        });
      });

      it("emit diagnostic if using relative path in config paths", async () => {
        host.addTypeSpecFile(
          "ws/tspconfig.yaml",
          stringify({
            "output-dir": "./my-output",
          }),
        );
        const [_, diagnostics] = await getCompilerOptions(
          host.compilerHost,
          "ws/main.tsp",
          cwd,
          {},
          {},
        );

        expectDiagnostics(diagnostics, {
          code: "config-path-absolute",
          message: `Path "./my-output" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
        });
      });
    });

    async function resolveCompilerOptionsFor({
      args,
      config,
    }: {
      args?: CompileCliArgs;
      config?: TypeSpecRawConfig;
    }) {
      host.addTypeSpecFile("ws/tspconfig.yaml", stringify(config ?? {}));
      return (await resolveCompilerOptions(args ?? {})) ?? {};
    }

    interface TestUnifiedOptions<
      K extends keyof CompileCliArgs & keyof TypeSpecRawConfig,
      T extends Exclude<keyof CompilerOptions, "configFile">,
    > {
      default: CompileCliArgs[K];
      set: { in: CompileCliArgs[K]; alt: CompileCliArgs[K]; expected: CompilerOptions[T] }[];
    }

    function testUnifiedOptions<
      K extends keyof CompileCliArgs & keyof TypeSpecRawConfig,
      T extends Exclude<keyof CompilerOptions, "configFile">,
    >(name: K, resolvedName: T, data: TestUnifiedOptions<K, T>) {
      describe(name, () => {
        it("default", async () => {
          const options = await resolveCompilerOptionsFor({});
          strictEqual(options[resolvedName], data.default);
        });

        for (const { in: input, alt, expected } of data.set) {
          describe(`input: ${input}`, () => {
            it("set from the cli args", async () => {
              const options = await resolveCompilerOptionsFor({ args: { [name]: input } });
              deepStrictEqual(options[resolvedName], expected);
            });

            it("set from the config", async () => {
              const options = await resolveCompilerOptionsFor({ config: { [name]: input } });
              deepStrictEqual(options[resolvedName], expected);
            });

            it("both cli and config (cli wins)", async () => {
              const options = await resolveCompilerOptionsFor({
                args: { [name]: input },
                config: { [name]: alt },
              });
              deepStrictEqual(options[resolvedName], expected);
            });
          });
        }
      });
    }

    testUnifiedOptions("warn-as-error", "warningAsError", {
      default: undefined,
      set: [
        { in: true, expected: true, alt: false },
        { in: false, expected: false, alt: true },
      ],
    });

    testUnifiedOptions("output-dir", "outputDir", {
      default: resolveVirtualPath("ws/tsp-output"),
      set: [
        {
          in: "{cwd}/override",
          expected: resolveVirtualPath("ws/override"),
          alt: "{cwd}/alt-in-config",
        },
      ],
    });

    testUnifiedOptions("trace", "trace", {
      default: undefined,
      set: [{ in: ["one", "two"], expected: ["one", "two"], alt: ["three"] }],
    });
  });
});
