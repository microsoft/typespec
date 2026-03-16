import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { Diagnostic, EmitContext, createTypeSpecLibrary } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
import { mockFile } from "../../src/testing/fs.js";
import { Tester } from "../tester.js";

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

const fakeEmitterWithDefaults = createTypeSpecLibrary({
  name: "fake-emitter-defaults",
  diagnostics: {},
  emitter: {
    options: {
      type: "object",
      properties: {
        "target-name": { type: "string", nullable: true, default: "defaultTarget" },
        "max-files": { type: "number", nullable: true, default: 10 },
        verbose: { type: "boolean", nullable: true, default: false },
      },
      additionalProperties: false,
    },
  },
});

describe("compiler: emitter options", () => {
  async function runWithEmitterOptions(
    options: Record<string, unknown>,
  ): Promise<[EmitContext | undefined, readonly Diagnostic[]]> {
    let emitContext: EmitContext | undefined;
    const diagnostics = await Tester.files({
      "node_modules/fake-emitter/package.json": JSON.stringify({
        main: "index.js",
      }),
      "node_modules/fake-emitter/index.js": mockFile.js({
        $lib: fakeEmitter,
        $onEmit: (ctx: EmitContext) => {
          emitContext = ctx;
        },
      }),
    }).diagnose("", {
      compilerOptions: {
        emit: ["fake-emitter"],
        options: {
          "fake-emitter": options,
        },
      },
    });
    return [emitContext, diagnostics];
  }

  async function diagnoseEmitterOptions(
    options: Record<string, unknown>,
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

    // This was disabled due to making it impossible to use windows path via the cli https://github.com/microsoft/typespec/pull/4173
    it.skip("emit diagnostic if passing windows style path", async () => {
      const diagnostics = await diagnoseEmitterOptions({
        "asset-dir": "C:\\abc\\def",
      });
      expectDiagnostics(diagnostics, {
        code: "path-unix-style",
        message: `Path should use unix style separators. Use "/" instead of "\\".`,
      });
    });
  });

  describe("schema defaults", () => {
    async function runWithDefaultsEmitter(
      options: Record<string, unknown>,
    ): Promise<[EmitContext | undefined, readonly Diagnostic[]]> {
      let emitContext: EmitContext | undefined;
      const diagnostics = await Tester.files({
        "node_modules/fake-emitter-defaults/package.json": JSON.stringify({
          main: "index.js",
        }),
        "node_modules/fake-emitter-defaults/index.js": mockFile.js({
          $lib: fakeEmitterWithDefaults,
          $onEmit: (ctx: EmitContext) => {
            emitContext = ctx;
          },
        }),
      }).diagnose("", {
        compilerOptions: {
          emit: ["fake-emitter-defaults"],
          options: {
            "fake-emitter-defaults": options,
          },
        },
      });
      return [emitContext, diagnostics];
    }

    it("applies default values from schema when options are not provided", async () => {
      const [context, diagnostics] = await runWithDefaultsEmitter({});
      expectDiagnosticEmpty(diagnostics);
      ok(context, "Emit context should have been set.");
      strictEqual(context.options["target-name"], "defaultTarget");
      strictEqual(context.options["max-files"], 10);
      strictEqual(context.options["verbose"], false);
    });

    it("user-provided values override defaults", async () => {
      const [context, diagnostics] = await runWithDefaultsEmitter({
        "target-name": "custom",
        "max-files": 20,
        verbose: true,
      });
      expectDiagnosticEmpty(diagnostics);
      ok(context, "Emit context should have been set.");
      strictEqual(context.options["target-name"], "custom");
      strictEqual(context.options["max-files"], 20);
      strictEqual(context.options["verbose"], true);
    });

    it("applies defaults only for missing options", async () => {
      const [context, diagnostics] = await runWithDefaultsEmitter({
        "target-name": "custom",
      });
      expectDiagnosticEmpty(diagnostics);
      ok(context, "Emit context should have been set.");
      strictEqual(context.options["target-name"], "custom");
      strictEqual(context.options["max-files"], 10);
      strictEqual(context.options["verbose"], false);
    });
  });
});
