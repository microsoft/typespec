import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Diagnostic, EmitContext, createTypeSpecLibrary } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
import { createTestHost } from "../../src/testing/test-host.js";

const fakeEmitter = createTypeSpecLibrary({
  name: "fake-emitter",
  diagnostics: {},
  emitter: {
    options: {
      type: "object",
      properties: {
        "asset-dir": { type: "string", format: "absolute-path", nullable: true },
        "max-files": { type: "number", nullable: true },
      },
      additionalProperties: false,
    },
  },
});

describe("compiler: emitter options", () => {
  async function runWithEmitterOptions(
    options: Record<string, unknown>
  ): Promise<[EmitContext | undefined, readonly Diagnostic[]]> {
    let emitContext: EmitContext | undefined;
    const host = await createTestHost();
    host.addTypeSpecFile("main.tsp", "");
    host.addTypeSpecFile(
      "node_modules/fake-emitter/package.json",
      JSON.stringify({
        main: "index.js",
      })
    );
    host.addJsFile("node_modules/fake-emitter/index.js", {
      $lib: fakeEmitter,
      $onEmit: (ctx: EmitContext) => {
        emitContext = ctx;
      },
    });

    const diagnostics = await host.diagnose("main.tsp", {
      emit: ["fake-emitter"],
      options: {
        "fake-emitter": options,
      },
    });
    return [emitContext, diagnostics];
  }

  async function diagnoseEmitterOptions(
    options: Record<string, unknown>
  ): Promise<readonly Diagnostic[]> {
    const [_, diagnostics] = await runWithEmitterOptions(options);
    return diagnostics;
  }

  async function getEmitContext(options: Record<string, unknown>): Promise<EmitContext> {
    const [context, diagnostics] = await runWithEmitterOptions(options);
    expectDiagnosticEmpty(diagnostics);
    ok(context, "Emit context should have been set.");
    return context;
  }

  it("pass options", async () => {
    const context = await getEmitContext({
      "emitter-output-dir": "/out",
      "asset-dir": "/assets",
      "max-files": 10,
    });

    strictEqual(context.emitterOutputDir, "/out");
    strictEqual(context.options["asset-dir"], "/assets");
    strictEqual(context.options["max-files"], 10);
  });

  it("emit diagnostic if passing unknown option", async () => {
    const diagnostics = await diagnoseEmitterOptions({
      "invalid-option": "abc",
    });
    expectDiagnostics(diagnostics, {
      code: "invalid-schema",
      message: [
        "Schema violation: must NOT have additional properties (/)",
        "  additionalProperty: invalid-option",
      ].join("\n"),
    });
  });

  it("emit diagnostic if passing invalid option type", async () => {
    const diagnostics = await diagnoseEmitterOptions({
      "max-files": "not a number",
    });
    expectDiagnostics(diagnostics, {
      code: "invalid-schema",
      message: "Schema violation: must be number (/max-files)",
    });
  });

  describe("format: absolute-path", () => {
    it("emit diagnostic if passing relative path starting with `./`", async () => {
      const diagnostics = await diagnoseEmitterOptions({
        "asset-dir": "./assets",
      });
      expectDiagnostics(diagnostics, {
        code: "config-path-absolute",
        message: `Path "./assets" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
      });
    });

    it("emit diagnostic if passing relative path if starting with the file/dir name", async () => {
      const diagnostics = await diagnoseEmitterOptions({
        "asset-dir": "assets",
      });
      expectDiagnostics(diagnostics, {
        code: "config-path-absolute",
        message: `Path "assets" cannot be relative. Use {cwd} or {project-root} to specify what the path should be relative to.`,
      });
    });

    it("emit diagnostic if passing windows style path", async () => {
      const diagnostics = await diagnoseEmitterOptions({
        "asset-dir": "C:\\abc\\def",
      });
      expectDiagnostics(diagnostics, {
        code: "path-unix-style",
        message: `Path should use unix style separators. Use "/" instead of "\\".`,
      });
    });
  });
});
