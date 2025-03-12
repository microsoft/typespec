import { EmitContext, Program } from "@typespec/compiler";
import { statSync } from "fs";
import { afterAll, describe, expect, it, vi } from "vitest";
import { $onEmit } from "../../src/emitter.js";
import { execCSharpGenerator } from "../../src/lib/utils.js";
import { CSharpEmitterOptions } from "../../src/options.js";
import { createEmitterContext } from "./utils/test-util.js";

afterAll(() => {
  vi.restoreAllMocks();
});

describe("execCSharpGenerator", () => {
  // Setup mocks
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
      };
    }),
  }));

  vi.mock("../../src/lib/utils.js", () => ({
    execCSharpGenerator: vi.fn(),
    execAsync: vi.fn(),
  }));

  vi.mock("../../src/lib/lib.js", () => ({
    getTracer: vi.fn().mockReturnValue({
      trace: vi.fn(),
    }),
  }));

  vi.mock("../../src/lib/client-model-builder.js", () => ({
    createModel: vi.fn().mockReturnValue({ Name: "TestNamespace" }),
  }));

  const program = {
    compilerOptions: { noEmit: false },
    hasError: () => false,
    host: {
      writeFile: vi.fn(),
      rm: vi.fn(),
      getTracer: {
        sub: vi.fn(),
        trace: vi.fn(),
      },
    },
    tracer: {
      sub: vi.fn(),
    },
    stateMap: vi.fn(),
    reportDiagnostics: vi.fn(),
  } as unknown as Program;

  vi.mock("fs", async (importOriginal) => {
    const actualFs = await importOriginal<typeof import("fs")>();

    return {
      ...actualFs,
      existsSync: vi.fn(),
      statSync: vi.fn(),
    };
  });

  it("should set newProject to true if .csproj file DOES NOT exist", async () => {
    vi.mocked(statSync).mockImplementation(() => {
      throw new Error("File not found");
    });

    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program);
    await $onEmit(context);

    expect(execCSharpGenerator).toHaveBeenCalledWith(expect.anything(), {
      generatorPath: expect.any(String),
      outputFolder: expect.any(String),
      pluginName: "ScmCodeModelPlugin",
      newProject: true, // Ensure this is passed as true
      debug: false,
    });
  });

  it("should set newProject to false if .csproj file DOES exist", async () => {
    vi.mocked(statSync).mockReturnValue({ isFile: () => true } as any);

    let context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program);
    await $onEmit(context);

    expect(execCSharpGenerator).toHaveBeenCalledWith(expect.anything(), {
      generatorPath: expect.any(String),
      outputFolder: expect.any(String),
      pluginName: "ScmCodeModelPlugin",
      newProject: false, // Ensure this is passed as false
      debug: false,
    });
  });
});
