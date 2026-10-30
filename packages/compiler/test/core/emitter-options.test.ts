import { ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getSourceLocation } from "../../src/core/diagnostics.js";
import type { CompilerOptions, Diagnostic, EmitContext } from "../../src/index.js";
import { createTypeSpecLibrary } from "../../src/index.js";
import { expectDiagnosticEmpty, expectDiagnostics } from "../../src/testing/expect.js";
import { mockFile } from "../../src/testing/fs.js";
import { parseYaml } from "../../src/yaml/parser.js";
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
  const subpathEmitter = createTypeSpecLibrary({
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

  async function runSubpathEmitter(
    emitterOptions: Record<string, Record<string, unknown>>,
    extraCompilerOptions: CompilerOptions = {},
  ) {
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
        $lib: subpathEmitter,
        $onEmit: (context: EmitContext) => {
          emitContext = context;
        },
      }),
    }).diagnose("", {
      compilerOptions: {
        emit: ["@org/fake-emitter/typescript"],
        options: emitterOptions,
        ...extraCompilerOptions,
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

  it("falls back to the package name when the subpath key is missing", async () => {
    const [context, diagnostics] = await runSubpathEmitter({
      "@org/fake-emitter": {
        "emitter-output-dir": "/from-package",
        "asset-dir": "/package-assets",
      },
    });

    expectDiagnosticEmpty(diagnostics);
    ok(context, "Emit context should have been set.");
    strictEqual(context.emitterOutputDir, "/from-package");
    strictEqual(context.options["asset-dir"], "/package-assets");
  });

  it("uses the subpath specifier for the default output directory", async () => {
    const [context, diagnostics] = await runSubpathEmitter({}, { outputDir: "/out" });

    expectDiagnosticEmpty(diagnostics);
    ok(context, "Emit context should have been set.");
    strictEqual(context.emitterOutputDir, "/out/@org/fake-emitter/typescript");
  });

  it("targets diagnostics at the options key that supplied fallback options", async () => {
    const [configFile] = parseYaml(
      ["options:", '  "@org/fake-emitter":', '    max-files: "not a number"', ""].join("\n"),
    );
    const [, diagnostics] = await runSubpathEmitter(
      {
        "@org/fake-emitter": {
          "max-files": "not a number",
        },
      },
      {
        configFile: {
          projectRoot: ".",
          diagnostics: [],
          outputDir: "tsp-output",
          file: configFile,
        },
      },
    );

    expectDiagnostics(diagnostics, {
      code: "invalid-schema",
      message: "Schema violation: must be number (/max-files)",
    });
    const location = getSourceLocation(diagnostics[0].target);
    ok(location, "Diagnostic should have a source location.");
    const snippet = location.file.text.slice(location.pos, location.end);
    ok(snippet.includes("max-files"), "Diagnostic should target the package-name option value.");
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
