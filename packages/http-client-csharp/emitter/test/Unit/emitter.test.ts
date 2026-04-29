vi.resetModules();

import { EmitContext, Program } from "@typespec/compiler";
import { TestHost } from "@typespec/compiler/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { generate } from "../../src/emit-generate.js";
import { execAsync, execCSharpGenerator } from "../../src/lib/utils.js";
import { CSharpEmitterOptions } from "../../src/options.js";
import { CodeModel } from "../../src/type/code-model.js";
import {
  createEmitterContext,
  createEmitterTestHost,
  getCreateSdkContext,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("$onEmit tests", () => {
  let program: Program;
  let $onEmit: (arg0: EmitContext<CSharpEmitterOptions>) => any;
  let emitCodeModel: (
    context: EmitContext<CSharpEmitterOptions>,
    updateCodeModel?: (model: CodeModel, context: any) => CodeModel,
  ) => any;
  beforeEach(async () => {
    // Reset the dynamically imported module to ensure a clean state
    vi.resetModules();
    vi.clearAllMocks();
    vi.mock("fs", async (importOriginal) => {
      const actualFs = await importOriginal<typeof import("fs")>();
      return {
        ...actualFs,
        statSync: vi.fn(),
      };
    });

    vi.mock("@typespec/compiler", async (importOriginal) => {
      const actual = await importOriginal<typeof import("@typespec/compiler")>();

      return {
        ...actual,
        resolvePath: vi.fn().mockImplementation((...args) => {
          return "C:/mocked/path";
        }),
      };
    });
    vi.mock("@azure-tools/typespec-client-generator-core", () => ({
      createSdkContext: vi.fn().mockImplementation(async (...args) => {
        return {
          sdkPackage: {},
          emitContext: args[0],
          program: args[0].program,
          diagnostics: [],
        };
      }),
    }));

    vi.mock("../../src/lib/utils.js", () => ({
      execCSharpGenerator: vi.fn(),
      execAsync: vi.fn(),
    }));

    vi.mock("../../src/emit-generate.js", () => ({
      generate: vi.fn(),
    }));

    vi.mock("../../src/lib/client-model-builder.js", () => ({
      createModel: vi.fn().mockReturnValue([{ name: "TestNamespace" }, []]),
    }));

    program = {
      compilerOptions: { noEmit: false },
      hasError: () => false,
      host: {
        writeFile: vi.fn(),
        rm: vi.fn(),
      },
      tracer: {
        sub: vi.fn().mockReturnValue({
          trace: vi.fn(),
        }),
        trace: vi.fn(),
      },
      trace: vi.fn(),
      stateMap: vi.fn(),
      reportDiagnostics: vi.fn(),
    } as unknown as Program;

    // dynamically import the module to get the $onEmit and emitCodeModel functions
    // we avoid importing it at the top to allow mocking of dependencies
    const emitterModule = await import("../../src/emitter.js");
    $onEmit = emitterModule.$onEmit;
    emitCodeModel = emitterModule.emitCodeModel;
  });

  it("should apply the updateCodeModel callback", async () => {
    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program);
    const updateCallback = vi.fn().mockImplementation((model: CodeModel) => {
      return model;
    });
    await emitCodeModel(context, updateCallback);
    expect(updateCallback).toHaveBeenCalledTimes(1);
  });

  it("should report diagnostic instead of throwing when generator fails", async () => {
    vi.mocked(execCSharpGenerator).mockResolvedValueOnce({
      exitCode: 1,
      stdout: "",
      stderr: "Unable to parse required option package-name from configuration.",
    } as any);
    vi.mocked(execAsync).mockResolvedValueOnce({
      exitCode: 0,
      stdio: "",
      stdout: "9.0.102",
      stderr: "",
      proc: { pid: 0, output: "", stdout: "", stderr: "", stdin: "" },
    } as any);

    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program);
    // should not throw
    await $onEmit(context);
    expect(program.reportDiagnostics).toHaveBeenCalled();
  });

  it("should apply sdk-context-options", async () => {
    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program);
    const additionalDecorators = ["Decorator1", "Decorator2"];
    context.options["sdk-context-options"] = {
      versioning: {
        previewStringRegex: /$/,
      },
      additionalDecorators: additionalDecorators,
    };
    await $onEmit(context);
    const createSdkContext = await getCreateSdkContext();
    expect(createSdkContext).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.objectContaining({
        additionalDecorators: additionalDecorators,
      }),
    );
  });

  it("should pass newProject FALSE by default", async () => {
    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program);
    await $onEmit(context);

    expect(generate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        newProject: false,
        generatorName: "ScmCodeModelGenerator",
      }),
    );
  });

  it("should pass newProject TRUE when set in options", async () => {
    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program, {
      "new-project": true,
    });
    await $onEmit(context);

    expect(generate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        newProject: true,
        generatorName: "ScmCodeModelGenerator",
      }),
    );
  });

  it("should pass newProject FALSE when set in options", async () => {
    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program, {
      "new-project": false,
    });
    await $onEmit(context);

    expect(generate).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(String),
      expect.any(String),
      expect.objectContaining({
        newProject: false,
        generatorName: "ScmCodeModelGenerator",
      }),
    );
  });
});

describe("emitCodeModel tests", () => {
  let runner: TestHost;
  let program: Program;

  beforeEach(async () => {
    vi.restoreAllMocks();
    runner = await createEmitterTestHost();
  });

  it("should return diagnostics array from emitCodeModel", async () => {
    program = await typeSpecCompile(
      `
      model TestModel {
        name: string;
      }
      
      @route("/test")
      op test(): TestModel;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const { emitCodeModel } = await import("../../src/emitter.js");
    const [, diagnostics] = await emitCodeModel(context);

    // Verify that diagnostics is an array
    expect(Array.isArray(diagnostics)).toBe(true);
    // Diagnostics array should be defined (may be empty or have diagnostics)
    expect(diagnostics).toBeDefined();
  });

  it("should collect diagnostics from createModel in emitCodeModel", async () => {
    program = await typeSpecCompile(
      `
      model TestModel {
        name: string;
      }
      
      @route("/test")
      op test(): TestModel;
      `,
      runner,
    );
    const context = createEmitterContext(program);
    const { emitCodeModel } = await import("../../src/emitter.js");
    const [, diagnostics] = await emitCodeModel(context);

    // The function should return diagnostics even if empty
    expect(diagnostics).toBeDefined();
    expect(Array.isArray(diagnostics)).toBe(true);
  });
});
