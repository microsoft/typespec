import { deepStrictEqual, ok, strictEqual } from "assert";
import { describe, it } from "vitest";
import { getSourceLocation } from "../../src/core/diagnostics.js";
import type { Diagnostic, EmitContext } from "../../src/index.js";
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

describe("subpath emitters", () => {
  const typescriptEmitter = "fake-emitter/typescript";
  const jsonSchemaEmitter = "fake-emitter/json-schema";

  function createSubpathEmitters() {
    const contexts: EmitContext[] = [];
    const files: Record<string, string | ReturnType<typeof mockFile.js>> = {
      "node_modules/fake-emitter/package.json": JSON.stringify({
        name: "fake-emitter",
        exports: {
          "./ts": "./typescript/index.js",
          "./json-schema": "./json-schema/index.js",
        },
      }),
    };
    for (const name of [typescriptEmitter, jsonSchemaEmitter]) {
      files[`node_modules/${name}/index.js`] = mockFile.js({
        $lib: createTypeSpecLibrary({
          name,
          diagnostics: {},
          emitter: fakeEmitter.emitter,
        }),
        $onEmit: (context: EmitContext) => {
          contexts.push(context);
        },
      });
    }
    return { tester: Tester.files(files), contexts };
  }

  it("uses each library's declared name for options, output directories, and statistics", async () => {
    const { tester, contexts } = createSubpathEmitters();
    const { program } = await tester.compile("", {
      compilerOptions: {
        emit: ["fake-emitter/ts", jsonSchemaEmitter],
        outputDir: "/out",
        options: {
          "fake-emitter": { "max-files": 99, "emitter-output-dir": "/legacy" },
          [typescriptEmitter]: { "max-files": 10 },
          [jsonSchemaEmitter]: { "max-files": 20 },
        },
      },
    });

    deepStrictEqual(
      contexts.map(({ options, emitterOutputDir }) => ({ options, emitterOutputDir })),
      [
        { options: { "max-files": 10 }, emitterOutputDir: `/out/${typescriptEmitter}` },
        { options: { "max-files": 20 }, emitterOutputDir: `/out/${jsonSchemaEmitter}` },
      ],
    );
    deepStrictEqual(Object.keys(program.stats.runtime.emit.emitters), [
      typescriptEmitter,
      jsonSchemaEmitter,
    ]);
  });

  it("retains package-name options as a fallback", async () => {
    const { tester, contexts } = createSubpathEmitters();
    await tester.compile("", {
      compilerOptions: {
        emit: ["fake-emitter/ts"],
        options: {
          "fake-emitter": { "max-files": 10, "emitter-output-dir": "/legacy" },
        },
      },
    });

    strictEqual(contexts[0].options["max-files"], 10);
    strictEqual(contexts[0].emitterOutputDir, "/legacy");
  });

  it.each([typescriptEmitter, "fake-emitter"])(
    "targets schema diagnostics at options configured under %s",
    async (optionsKey) => {
      const { tester } = createSubpathEmitters();
      const [configFile] = parseYaml(`options:\n  ${optionsKey}:\n    max-files: not-a-number\n`);
      const diagnostics = await tester.diagnose("", {
        compilerOptions: {
          emit: ["fake-emitter/ts"],
          options: { [optionsKey]: { "max-files": "not-a-number" } },
          configFile: {
            projectRoot: ".",
            diagnostics: [],
            outputDir: "tsp-output",
            file: configFile,
          },
        },
      });

      expectDiagnostics(diagnostics, {
        code: "invalid-schema",
        message: "Schema violation: must be number (/max-files)",
      });
      const location = getSourceLocation(diagnostics[0].target);
      ok(location);
      strictEqual(location.file.text.slice(location.pos, location.end), "max-files");
    },
  );
});

it("uses the declared library name for filesystem package emitters", async () => {
  let context: EmitContext | undefined;
  await Tester.files({
    "../local-emitter/package.json": JSON.stringify({
      name: "fake-emitter",
      main: "index.js",
    }),
    "../local-emitter/index.js": mockFile.js({
      $lib: createTypeSpecLibrary({ name: "fake-emitter/typescript", diagnostics: {} }),
      $onEmit: (emitContext: EmitContext) => {
        context = emitContext;
      },
    }),
  }).compile("", {
    compilerOptions: {
      emit: ["../local-emitter"],
      outputDir: "/out",
    },
  });

  ok(context);
  strictEqual(context.emitterOutputDir, "/out/fake-emitter/typescript");
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
