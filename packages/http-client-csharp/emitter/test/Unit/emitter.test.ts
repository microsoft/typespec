vi.resetModules();

import { EmitContext, Program } from "@typespec/compiler";
import { TestHost } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { statSync } from "fs";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { execAsync, execCSharpGenerator } from "../../src/lib/utils.js";
import { CSharpEmitterOptions } from "../../src/options.js";
import { CodeModel } from "../../src/type/code-model.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  getCreateSdkContext,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("$onEmit tests", () => {
  let program: Program;
  let $onEmit: (arg0: EmitContext<CSharpEmitterOptions>) => any;
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

    vi.mock("../../src/lib/client-model-builder.js", () => ({
      createModel: vi.fn().mockReturnValue({ Name: "TestNamespace" }),
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

    // dynamically import the module to get the $onEmit function
    // we avoid importing it at the top to allow mocking of dependencies
    $onEmit = (await import("../../src/emitter.js")).$onEmit;
  });

  it("should apply the update-code-model callback just once", async () => {
    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program);
    const updateCallback = vi.fn().mockImplementation((model: CodeModel) => {
      return model;
    });
    context.options["update-code-model"] = updateCallback;
    await $onEmit(context);
    expect(updateCallback).toHaveBeenCalledTimes(1);
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

  it("should set newProject to TRUE if .csproj file DOES NOT exist", async () => {
    vi.mocked(statSync).mockImplementation(() => {
      throw new Error("File not found");
    });

    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program);
    await $onEmit(context);

    expect(execCSharpGenerator).toHaveBeenCalledWith(expect.anything(), {
      generatorPath: expect.any(String),
      outputFolder: expect.any(String),
      generatorName: "ScmCodeModelGenerator",
      newProject: true, // Ensure this is passed as true
      debug: false,
    });
  });

  it("should set newProject to FALSE if .csproj file DOES exist", async () => {
    vi.mocked(statSync).mockReturnValue({ isFile: () => true } as any);

    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program);
    await $onEmit(context);

    expect(execCSharpGenerator).toHaveBeenCalledWith(expect.anything(), {
      generatorPath: expect.any(String),
      outputFolder: expect.any(String),
      generatorName: "ScmCodeModelGenerator",
      newProject: false, // Ensure this is passed as false
      debug: false,
    });
  });

  it("should set newProject to TRUE if passed in options", async () => {
    vi.mocked(statSync).mockReturnValue({ isFile: () => true } as any);

    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program, {
      "new-project": true,
    });
    await $onEmit(context);
    expect(execCSharpGenerator).toHaveBeenCalledWith(expect.anything(), {
      generatorPath: expect.any(String),
      outputFolder: expect.any(String),
      generatorName: "ScmCodeModelGenerator",
      newProject: true, // Ensure this is passed as true
      debug: false,
    });
  });

  it("should set newProject to FALSE if passed in options", async () => {
    vi.mocked(statSync).mockReturnValue({ isFile: () => true } as any);

    const context: EmitContext<CSharpEmitterOptions> = createEmitterContext(program, {
      "new-project": false,
    });
    await $onEmit(context);
    expect(execCSharpGenerator).toHaveBeenCalledWith(expect.anything(), {
      generatorPath: expect.any(String),
      outputFolder: expect.any(String),
      generatorName: "ScmCodeModelGenerator",
      newProject: false, // Ensure this is passed as true
      debug: false,
    });
  });
});

describe("Test _validateDotNetSdk", () => {
  let runner: TestHost;
  let program: Program;
  const minVersion = 8;
  let _validateDotNetSdk: (arg0: any, arg1: number) => Promise<boolean>;

  beforeEach(async () => {
    vi.resetModules();
    runner = await createEmitterTestHost();
    program = await typeSpecCompile(
      `
            op test(
                @query
                @encode(DurationKnownEncoding.ISO8601)
                input: duration
              ): NoContentResponse;
      `,
      runner,
    );
    // Restore all mocks before each test
    vi.restoreAllMocks();
    vi.mock("../../src/lib/utils.js", () => ({
      execCSharpGenerator: vi.fn(),
      execAsync: vi.fn(),
    }));

    // dynamically import the module to get the $onEmit function
    // we avoid importing it at the top to allow mocking of dependencies
    _validateDotNetSdk = (await import("../../src/emitter.js"))._validateDotNetSdk;
  });

  it("should return false and report diagnostic when dotnet SDK is not installed.", async () => {
    /* mock the scenario that dotnet SDK is not installed, so execAsync will throw exception with error ENOENT */
    const error: any = new Error("ENOENT: no such file or directory");
    error.code = "ENOENT";
    (execAsync as Mock).mockRejectedValueOnce(error);
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const result = await _validateDotNetSdk(sdkContext, minVersion);
    expect(result).toBe(false);
    strictEqual(program.diagnostics.length, 1);
    strictEqual(
      program.diagnostics[0].code,
      "@typespec/http-client-csharp/invalid-dotnet-sdk-dependency",
    );
    strictEqual(
      program.diagnostics[0].message,
      "The dotnet command was not found in the PATH. Please install the .NET SDK version 8 or above. Guidance for installing the .NET SDK can be found at https://dotnet.microsoft.com/.",
    );
  });

  it("should return true for installed SDK version whose major equals min supported version", async () => {
    /* mock the scenario that the installed SDK version whose major equals min supported version */
    (execAsync as Mock).mockResolvedValueOnce({
      exitCode: 0,
      stdio: "",
      stdout: "8.0.204",
      stderr: "",
      proc: { pid: 0, output: "", stdout: "", stderr: "", stdin: "" },
    });
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const result = await _validateDotNetSdk(sdkContext, minVersion);
    expect(result).toBe(true);
    /* no diagnostics */
    strictEqual(program.diagnostics.length, 0);
  });

  it("should return true for installed SDK version whose major greaters than min supported version", async () => {
    /* mock the scenario that the installed SDK version whose major greater than min supported version */
    (execAsync as Mock).mockResolvedValueOnce({
      exitCode: 0,
      stdio: "",
      stdout: "9.0.102",
      stderr: "",
      proc: { pid: 0, output: "", stdout: "", stderr: "", stdin: "" },
    });
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const result = await _validateDotNetSdk(sdkContext, minVersion);
    expect(result).toBe(true);
    /* no diagnostics */
    strictEqual(program.diagnostics.length, 0);
  });

  it("should return false and report diagnostic for invalid .NET SDK version", async () => {
    /* mock the scenario that the installed SDK version whose major less than min supported version */
    (execAsync as Mock).mockResolvedValueOnce({
      exitCode: 0,
      stdio: "",
      stdout: "5.0.408",
      stderr: "",
      proc: { pid: 0, output: "", stdout: "", stderr: "", stdin: "" },
    });
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const result = await _validateDotNetSdk(sdkContext, minVersion);
    expect(result).toBe(false);
    strictEqual(program.diagnostics.length, 1);
    strictEqual(
      program.diagnostics[0].code,
      "@typespec/http-client-csharp/invalid-dotnet-sdk-dependency",
    );
    strictEqual(
      program.diagnostics[0].message,
      "The .NET SDK found is version 5.0.408. Please install the .NET SDK 8 or above and ensure there is no global.json in the file system requesting a lower version. Guidance for installing the .NET SDK can be found at https://dotnet.microsoft.com/.",
    );
  });
});
