vi.resetModules();

import { Diagnostic, Program } from "@typespec/compiler";
import { TestHost } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { execAsync } from "../../src/lib/utils.js";
import {
  createCSharpSdkContext,
  createEmitterContext,
  createEmitterTestHost,
  typeSpecCompile,
} from "./utils/test-util.js";

describe("Test _validateDotNetSdk", () => {
  let runner: TestHost;
  let program: Program;
  const minVersion = 8;
  let _validateDotNetSdk: (arg0: any, arg1: number) => Promise<[boolean, readonly Diagnostic[]]>;

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

    // dynamically import the module to get the _validateDotNetSdk function
    _validateDotNetSdk = (await import("../../src/emit-generate.js"))._validateDotNetSdk;
  });

  it("should return false and report diagnostic when dotnet SDK is not installed.", async () => {
    const error: any = new Error("ENOENT: no such file or directory");
    error.code = "ENOENT";
    (execAsync as Mock).mockRejectedValueOnce(error);
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [result, diagnostics] = await _validateDotNetSdk(sdkContext, minVersion);
    program.reportDiagnostics(diagnostics);
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
    (execAsync as Mock).mockResolvedValueOnce({
      exitCode: 0,
      stdio: "",
      stdout: "8.0.204",
      stderr: "",
      proc: { pid: 0, output: "", stdout: "", stderr: "", stdin: "" },
    });
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [result, diagnostics] = await _validateDotNetSdk(sdkContext, minVersion);
    expect(result).toBe(true);
    strictEqual(diagnostics.length, 0);
  });

  it("should return true for installed SDK version whose major greaters than min supported version", async () => {
    (execAsync as Mock).mockResolvedValueOnce({
      exitCode: 0,
      stdio: "",
      stdout: "9.0.102",
      stderr: "",
      proc: { pid: 0, output: "", stdout: "", stderr: "", stdin: "" },
    });
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [result, diagnostics] = await _validateDotNetSdk(sdkContext, minVersion);
    expect(result).toBe(true);
    strictEqual(diagnostics.length, 0);
  });

  it("should return false and report diagnostic for invalid .NET SDK version", async () => {
    (execAsync as Mock).mockResolvedValueOnce({
      exitCode: 0,
      stdio: "",
      stdout: "5.0.408",
      stderr: "",
      proc: { pid: 0, output: "", stdout: "", stderr: "", stdin: "" },
    });
    const context = createEmitterContext(program);
    const sdkContext = await createCSharpSdkContext(context);
    const [result, diagnostics] = await _validateDotNetSdk(sdkContext, minVersion);
    program.reportDiagnostics(diagnostics);
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
