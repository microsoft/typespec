import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import type { Diagnostic, EmitContext } from "../../src/index.js";
import { createTypeSpecLibrary } from "../../src/index.js";
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

describe("subpath export emitters", () => {
  const subpathLib = createTypeSpecLibrary({
    name: "@org/fake-emitter/typescript",
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

  async function runSubpathEmitter(options: Record<string, Record<string, unknown>>) {
    let emitContext: EmitContext | undefined;
    const diagnostics = await Tester.files({
      "node_modules/@org/fake-emitter/package.json": JSON.stringify({
        name: "@org/fake-emitter",
        exports: {
          ".": "./index.js",
          "./typescript": "./typescript/index.js",
        },
      }),
      "node_modules/@org/fake-emitter/index.js": mockFile.js({
        $lib: createTypeSpecLibrary({ name: "@org/fake-emitter", diagnostics: {} }),
      }),
      "node_modules/@org/fake-emitter/typescript/index.js": mockFile.js({
        $lib: subpathLib,
        $onEmit: (ctx: EmitContext) => {
          emitContext = ctx;
        },
      }),
    }).diagnose("", {
      compilerOptions: {
        emit: ["@org/fake-emitter/typescript"],
        options,
      },
    });
    return [emitContext, diagnostics] as const;
  }

  it("resolves options keyed by the subpath specifier", async () => {
    const [context, diagnostics] = await runSubpathEmitter({
      "@org/fake-emitter/typescript": {
        "emitter-output-dir": "/out",
        "asset-dir": "/assets",
        "max-files": 10,
      },
    });
    expectDiagnosticEmpty(diagnostics);
    ok(context, "Emit context should have been set.");
    strictEqual(context.emitterOutputDir, "/out");
    strictEqual(context.options["asset-dir"], "/assets");
    strictEqual(context.options["max-files"], 10);
  });

  it("falls back to package.json name when the subpath key is missing", async () => {
    const [context, diagnostics] = await runSubpathEmitter({
      "@org/fake-emitter": {
        "emitter-output-dir": "/from-pkg",
        "asset-dir": "/pkg-assets",
      },
    });
    expectDiagnosticEmpty(diagnostics);
    ok(context, "Emit context should have been set.");
    strictEqual(context.emitterOutputDir, "/from-pkg");
    strictEqual(context.options["asset-dir"], "/pkg-assets");
  });

  it("targets the package-name options key when validating fallback options", async () => {
    const [, diagnostics] = await runSubpathEmitter({
      "@org/fake-emitter": {
        "invalid-option": "abc",
      },
    });
    expectDiagnostics(diagnostics, {
      code: "invalid-schema",
      message: [
        "Schema violation: must NOT have additional properties (/)",
        "  additionalProperty: invalid-option",
      ].join("\n"),
    });
    const target = diagnostics[0]?.target;
    if (target && typeof target === "object" && "path" in target) {
      strictEqual((target as { path: string[] }).path.join("."), "options.@org/fake-emitter");
    }
  });
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
