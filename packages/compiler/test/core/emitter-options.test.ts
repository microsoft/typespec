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
});

describe("compiler: emitter options defined in TypeSpec", () => {
  const tspOptionsEmitter = createTypeSpecLibrary({
    name: "tsp-options-emitter",
    diagnostics: {},
  });

  async function diagnoseEmitterOptions(
    options: Record<string, unknown>,
    { optedIn = true }: { optedIn?: boolean } = {},
  ): Promise<readonly Diagnostic[]> {
    return Tester.files({
      "node_modules/tsp-options-emitter/package.json": JSON.stringify({
        main: "index.js",
        exports: {
          ".": "./index.js",
          "./options": { typespec: "./options.tsp" },
        },
      }),
      "node_modules/tsp-options-emitter/options.tsp": `model EmitterOptions {
        name?: string;
        count?: int32;
        format?: "yaml" | "json";
      }`,
      "node_modules/tsp-options-emitter/index.js": mockFile.js({
        $lib: tspOptionsEmitter,
        $onEmit: () => {},
        ...(optedIn ? { $flags: { experimentalEmitterOptions: true } } : {}),
      }),
    }).diagnose("", {
      compilerOptions: {
        emit: ["tsp-options-emitter"],
        options: {
          "tsp-options-emitter": options,
        },
      },
    });
  }

  it("passes valid options", async () => {
    const diagnostics = await diagnoseEmitterOptions({
      "emitter-output-dir": "/out",
      name: "hello",
      count: 3,
      format: "json",
    });
    expectDiagnosticEmpty(diagnostics);
  });

  it("emits diagnostic for an unknown property", async () => {
    const diagnostics = await diagnoseEmitterOptions({ "not-an-option": true });
    expectDiagnostics(diagnostics, {
      code: "invalid-emitter-options",
      message: `Unknown property "not-an-option"`,
    });
  });

  it("emits diagnostic for an invalid value type", async () => {
    const diagnostics = await diagnoseEmitterOptions({ count: "not a number" });
    expectDiagnostics(diagnostics, {
      code: "invalid-emitter-options",
      message: "Expected type number",
    });
  });

  it("emits diagnostic for a value outside an allowed union", async () => {
    const diagnostics = await diagnoseEmitterOptions({ format: "xml" });
    expectDiagnostics(diagnostics, {
      code: "invalid-emitter-options",
      message: `Value "xml" is not one of the allowed values: "yaml", "json"`,
    });
  });

  it("does not validate options when the emitter has not opted in", async () => {
    const diagnostics = await diagnoseEmitterOptions(
      { "not-an-option": true, count: "not a number" },
      { optedIn: false },
    );
    expectDiagnosticEmpty(diagnostics);
  });

  it("attributes errors in the emitter's own options file to the emitter author", async () => {
    const diagnostics = await Tester.files({
      "node_modules/tsp-options-emitter/package.json": JSON.stringify({
        main: "index.js",
        exports: {
          ".": "./index.js",
          "./options": { typespec: "./options.tsp" },
        },
      }),
      "node_modules/tsp-options-emitter/options.tsp": `model EmitterOptions {
        name?: NotARealType;
      }`,
      "node_modules/tsp-options-emitter/index.js": mockFile.js({
        $lib: tspOptionsEmitter,
        $onEmit: () => {},
        $flags: { experimentalEmitterOptions: true },
      }),
    }).diagnose("", {
      compilerOptions: {
        emit: ["tsp-options-emitter"],
        options: { "tsp-options-emitter": {} },
      },
    });
    expectDiagnostics(diagnostics, {
      code: "invalid-emitter-options-definition",
    });
  });
});
