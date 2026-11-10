import { deepStrictEqual, ok, strictEqual } from "assert";
import { beforeEach, describe, it } from "vitest";
import { stringify } from "yaml";
import type { TypeSpecRawConfig } from "../src/config/types.js";
import type { CompileCliArgs } from "../src/core/cli/actions/compile/args.js";
import { getCompilerOptions } from "../src/core/cli/actions/compile/args.js";
import { createLinterRule, paramMessage } from "../src/core/library.js";
import type { CompilerOptions } from "../src/core/options.js";
import { NoTarget } from "../src/core/types.js";
import type { TestHost } from "../src/testing/index.js";
import {
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

    it("error if option doesn't have =", async () => {
      const [_, diagnostics] = await getCompilerOptions(
        host.compilerHost,
        "ws/main.tsp",
        cwd,
        {
          options: [`my-emitter.bar`],
        },
        {},
      );

      expectDiagnostics(diagnostics, {
        code: "invalid-option-flag",
        message: `The --option parameter value "my-emitter.bar" must be in the format: <emitterName>.some-options=value`,
      });
    });

    it("should properly resolve --ignore-deprecated", async () => {
      const options = await resolveCompilerOptions({
        "ignore-deprecated": true,
      });

      strictEqual(options.ignoreDeprecated, true);
    });

    it("--option without an emitter are moved to miscOptions", async () => {
      const options = await resolveCompilerOptions({
        options: [`test-debug=true`],
      });

      deepStrictEqual(options?.miscOptions, { "test-debug": "true" });
      deepStrictEqual(options?.options, {});
    });

    it("--option allows root level options", async () => {
      const options = await resolveCompilerOptions({
        options: [`my-emitter.foo=abc`],
      });

      deepStrictEqual(options?.options, {
        "my-emitter": { foo: "abc" },
      });
    });

    it("--option allows nested options", async () => {
      const options = await resolveCompilerOptions({
        options: [`my-emitter.foo.bar=abc`],
      });

      deepStrictEqual(options?.options, {
        "my-emitter": { foo: { bar: "abc" } },
      });
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

    describe("linter overrides", () => {
      const unusedUsing = "@typespec/compiler/unused-using";
      const unusedTemplate = "@typespec/compiler/unused-template-parameter";
      const allRules: TypeSpecRawConfig = { linter: { extends: ["@typespec/compiler/all"] } };

      beforeEach(() => {
        host.addTypeSpecFile(
          "ws/main.tsp",
          "namespace Unused {} using Unused; model Example<T> {}",
        );
      });

      async function diagnose(args: CompileCliArgs = {}, config = allRules) {
        host.addTypeSpecFile("ws/tspconfig.yaml", stringify(config));
        const [options, diagnostics] = await getCompilerOptions(
          host.compilerHost,
          resolveVirtualPath("ws/main.tsp"),
          cwd,
          args,
          {},
        );
        expectDiagnosticEmpty(diagnostics);
        ok(options);
        return host.diagnose("ws/main.tsp", options);
      }

      it("disables linting without resolving configured rulesets, alongside --no-emit", async () => {
        expectDiagnosticEmpty(
          await diagnose(
            { "no-linter": true, "no-emit": true },
            {
              linter: {
                extends: ["not-installed/all"],
                enable: { [unusedUsing]: true },
              },
            },
          ),
        );
      });

      it("does not disable linting with --no-linter=false", async () => {
        expectDiagnostics(await diagnose({ "no-linter": false }), [
          { code: unusedUsing },
          { code: unusedTemplate },
        ]);
      });

      it("replaces configured extends but retains configured rule overrides", async () => {
        host.addTypeSpecFile(
          "ws/template-rules.yaml",
          stringify({ enable: { [unusedTemplate]: true } }),
        );
        expectDiagnostics(
          await diagnose(
            { "linter-ruleset": ["file:./template-rules.yaml"] },
            {
              linter: {
                extends: ["not-installed/all"],
                enable: { [unusedUsing]: true },
                disable: { [unusedTemplate]: "Not applicable" },
              },
            },
          ),
          { code: unusedUsing },
        );
      });

      it("combines repeated rulesets and resolves CLI files relative to cwd", async () => {
        host.addTypeSpecFile("ws/configs/override.yaml", stringify({}));
        host.addTypeSpecFile("ws/rules/first.yaml", stringify({ enable: { [unusedUsing]: true } }));
        host.addTypeSpecFile(
          "ws/rules/second.yaml",
          stringify({
            extends: ["file:./nested.yaml"],
          }),
        );
        host.addTypeSpecFile(
          "ws/rules/nested.yaml",
          stringify({ enable: { [unusedTemplate]: true } }),
        );

        expectDiagnostics(
          await diagnose({
            config: "configs/override.yaml",
            "linter-ruleset": ["file:./rules/first.yaml", "file:./rules/second.yaml"],
          }),
          [{ code: unusedUsing }, { code: unusedTemplate }],
        );
      });

      it("does not blame a CLI ruleset reference on an unrelated YAML entry", async () => {
        const diagnostics = await diagnose({
          "linter-ruleset": ["file:./not-found.yaml"],
        });
        expectDiagnostics(diagnostics, { code: "file-not-found" });
        strictEqual(diagnostics[0].target, NoTarget);
      });

      it("disables an inherited rule with false, including through its short name", async () => {
        expectDiagnostics(await diagnose({ "linter-rule": ["compiler/unused-using=false"] }), {
          code: unusedTemplate,
        });
      });

      it("re-enables a configured disabled rule using its other spelling", async () => {
        expectDiagnostics(
          await diagnose(
            { "linter-rule": ["compiler/unused-using=true"] },
            { linter: { disable: { [unusedUsing]: "Disabled in config" } } },
          ),
          { code: unusedUsing },
        );
      });

      function addBannedNameLinter() {
        const rule = createLinterRule({
          name: "banned-name",
          description: "Disallow a configurable model name",
          severity: "warning",
          messages: { default: paramMessage`${"message"}` },
          defaultOptions: { name: "Example", message: "Disallowed model name" },
          optionSchema: {
            type: "object",
            properties: { name: { type: "string" }, message: { type: "string" } },
            required: [],
            additionalProperties: false,
          },
          create(context) {
            return {
              model(model) {
                if (model.name === context.options.name) {
                  context.reportDiagnostic({
                    target: model,
                    format: { message: context.options.message },
                  });
                }
              },
            };
          },
        });
        host.addTypeSpecFile("ws/main.tsp", 'import "@typespec/test-linter"; model Example {}');
        host.addTypeSpecFile(
          "ws/node_modules/@typespec/test-linter/package.json",
          JSON.stringify({ name: "@typespec/test-linter", main: "index.js" }),
        );
        host.addJsFile("ws/node_modules/@typespec/test-linter/index.js", {
          $linter: {
            rules: [rule],
            ruleSets: {
              invalid: {
                enable: { "@typespec/test-linter/banned-name": { name: 123 } },
              },
            },
          },
        });
      }

      it("replaces configured options with JSON values containing =", async () => {
        addBannedNameLinter();
        expectDiagnostics(
          await diagnose(
            { "linter-rule": ['@typespec/test-linter/banned-name={"message":"a=b"}'] },
            {
              linter: {
                enable: { "@typespec/test-linter/banned-name": { name: "Other" } },
              },
            },
          ),
          { code: "@typespec/test-linter/banned-name", message: "a=b" },
        );
      });

      it("validates only the final CLI settings for a canonical rule", async () => {
        addBannedNameLinter();
        const valid = "test-linter/banned-name={}";
        const invalid = '@typespec/test-linter/banned-name={"name":123}';
        const config: TypeSpecRawConfig = {
          linter: { enable: { "@typespec/test-linter/banned-name": { name: 123 } } },
        };

        expectDiagnostics(await diagnose({ "linter-rule": [invalid, valid] }, config), {
          code: "@typespec/test-linter/banned-name",
        });
        expectDiagnostics(await diagnose({ "linter-rule": [valid, invalid] }, config), {
          code: "invalid-rule-options",
        });
      });

      it.each(["library", "file"])(
        "overrides invalid options inherited from a %s ruleset",
        async (source) => {
          addBannedNameLinter();
          host.addTypeSpecFile(
            "ws/rules/outer.yaml",
            stringify({ extends: ["file:./inner.yaml"] }),
          );
          host.addTypeSpecFile(
            "ws/rules/inner.yaml",
            stringify({
              enable: { "@typespec/test-linter/banned-name": { name: 123 } },
            }),
          );
          const config: TypeSpecRawConfig =
            source === "library" ? { linter: { extends: ["@typespec/test-linter/invalid"] } } : {};
          const args: CompileCliArgs =
            source === "file" ? { "linter-ruleset": ["file:./rules/outer.yaml"] } : {};

          expectDiagnostics(await diagnose(args, config), { code: "invalid-rule-options" });
          expectDiagnostics(
            await diagnose({ ...args, "linter-rule": ["compiler/unused-using=false"] }, config),
            { code: "invalid-rule-options" },
          );
          expectDiagnostics(
            await diagnose(
              {
                ...args,
                "linter-rule": ['test-linter/banned-name={"name":"Example"}'],
              },
              config,
            ),
            { code: "@typespec/test-linter/banned-name" },
          );
          expectDiagnosticEmpty(
            await diagnose(
              { ...args, "linter-rule": ["@typespec/test-linter/banned-name=false"] },
              config,
            ),
          );
        },
      );

      for (const value of [
        "compiler/unused-using",
        "=true",
        "compiler/unused-using={",
        "compiler/unused-using=null",
        "compiler/unused-using=[]",
      ]) {
        it(`reports invalid rule override ${value}`, async () => {
          const [, diagnostics] = await getCompilerOptions(
            host.compilerHost,
            resolveVirtualPath("ws/main.tsp"),
            cwd,
            { "linter-rule": [value] },
            {},
          );
          expectDiagnostics(diagnostics, { code: "invalid-linter-rule-flag" });
        });
      }
    });
  });

  describe("project config validation with --config", () => {
    it("errors when --config points to a project config", async () => {
      host.addTypeSpecFile(
        "ws/configs/tspconfig.yaml",
        stringify({ kind: "project", emit: ["openapi"] }),
      );
      const [_, diagnostics] = await getCompilerOptions(
        host.compilerHost,
        "ws/main.tsp",
        cwd,
        { config: "configs/tspconfig.yaml" },
        {},
      );
      expectDiagnostics(diagnostics, {
        code: "config-project-not-as-cli-config",
      });
    });

    it("auto-inherits entrypoint from project tspconfig when using --config", async () => {
      host.addTypeSpecFile(
        "ws/tspconfig.yaml",
        stringify({ kind: "project", entrypoint: "src/service.tsp" }),
      );
      host.addTypeSpecFile("ws/src/service.tsp", "");
      host.addTypeSpecFile("ws/tspconfig.build.yaml", stringify({ emit: ["openapi"] }));
      const [options, diagnostics] = await getCompilerOptions(
        host.compilerHost,
        "ws/main.tsp",
        cwd,
        { config: "tspconfig.build.yaml" },
        {},
      );
      expectDiagnosticEmpty(diagnostics);
      ok(options, "Options should have been set.");
      strictEqual(options.configFile?.entrypoint, "src/service.tsp");
    });

    it("auto-inherits features from project tspconfig when using --config", async () => {
      host.addTypeSpecFile(
        "ws/tspconfig.yaml",
        stringify({ kind: "project", features: ["function-declarations"] }),
      );
      host.addTypeSpecFile("ws/tspconfig.build.yaml", stringify({ emit: ["openapi"] }));
      const [options, diagnostics] = await getCompilerOptions(
        host.compilerHost,
        "ws/main.tsp",
        cwd,
        { config: "tspconfig.build.yaml" },
        {},
      );
      expectDiagnosticEmpty(diagnostics);
      ok(options, "Options should have been set.");
      deepStrictEqual(options.configFile?.features, ["function-declarations"]);
    });

    it("does not auto-inherit build config from project tspconfig", async () => {
      host.addTypeSpecFile(
        "ws/tspconfig.yaml",
        stringify({ kind: "project", emit: ["should-not-inherit"] }),
      );
      host.addTypeSpecFile("ws/tspconfig.build.yaml", stringify({ emit: ["openapi"] }));
      const [options, diagnostics] = await getCompilerOptions(
        host.compilerHost,
        "ws/main.tsp",
        cwd,
        { config: "tspconfig.build.yaml" },
        {},
      );
      expectDiagnosticEmpty(diagnostics);
      ok(options, "Options should have been set.");
      deepStrictEqual(options.emit, ["openapi"]);
    });
  });
});
