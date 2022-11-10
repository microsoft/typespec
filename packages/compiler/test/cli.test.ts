import { deepStrictEqual, strictEqual } from "assert";
import { dump } from "js-yaml";
import { CompileCliArgs, getCompilerOptions } from "../core/cli/args.js";
import {
  createTestHost,
  expectDiagnosticEmpty,
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
        emitters: {},
        outputDir: `${cwd}/cadl-output`,
      });
    });

    context("config file with emitters", () => {
      beforeEach(() => {
        host.addCadlFile(
          "ws/cadl-project.yaml",
          dump({
            parameters: {
              "custom-arg": {
                default: "default-arg-value",
              },
            },
            emitters: {
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
          options?.emitters?.["@cadl-lang/openapi3"]?.["emitter-output-dir"],
          `${cwd}/cadl-output/custom`
        );
      });

      it("override output-dir from cli args", async () => {
        const options = await resolveCompilerOptions({ "output-dir": `${cwd}/my-output-dir` });

        strictEqual(
          options?.emitters?.["@cadl-lang/openapi3"]?.["emitter-output-dir"],
          `${cwd}/my-output-dir/custom`
        );
      });

      it("override emitter-output-dir from cli args", async () => {
        const options = await resolveCompilerOptions({
          options: [`@cadl-lang/openapi3.emitter-output-dir={cwd}/relative-to-cwd`],
        });

        strictEqual(
          options?.emitters?.["@cadl-lang/openapi3"]?.["emitter-output-dir"],
          `${cwd}/relative-to-cwd`
        );
      });

      describe("arg interpolation", () => {
        it("use default arg value", async () => {
          const options = await resolveCompilerOptions({
            args: [`custom-arg=my-updated-arg-value`],
          });

          strictEqual(
            options?.emitters?.["@cadl-lang/with-args"]?.["emitter-output-dir"],
            `default-arg-value/custom`
          );
        });

        it("passing --arg interpolate args in the cli", async () => {
          const options = await resolveCompilerOptions({
            args: [`custom-arg=my-updated-arg-value`],
          });

          strictEqual(
            options?.emitters?.["@cadl-lang/with-args"]?.["emitter-output-dir"],
            `my-updated-arg-value/custom`
          );
        });
      });
    });
  });
});
