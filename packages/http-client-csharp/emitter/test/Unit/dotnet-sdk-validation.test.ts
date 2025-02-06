import { Program } from "@typespec/compiler";
import { TestHost } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { SpawnOptions } from "child_process";
import { afterEach, beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { _validateDotNetSdk } from "../../src/emitter.js";
import { execAsync } from "../../src/lib/utils.js";
import { createEmitterTestHost, typeSpecCompile } from "./utils/test-util.js";

describe("Test _validateDotNetSdk", () => {
  let runner: TestHost;
  let program: Program;
  const minVersion = 8;

  vi.mock("../../src/lib/utils.js", () => ({
    execAsync: vi.fn(),
  }));

  beforeEach(async () => {
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
  });

  afterEach(() => {
    // Restore all mocks after each test
    vi.restoreAllMocks();
  });

  it("should return false and report diagnostic when dotnet SDK is not installed.", async () => {
    /* mock the scenario that dotnet SDK is not installed, so execAsync will throw exception with error ENOENT */
    const error: any = new Error("ENOENT: no such file or directory");
    error.code = "ENOENT";
    (execAsync as Mock).mockRejectedValue(error);
    const result = await _validateDotNetSdk(program, minVersion);
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
    (execAsync as Mock).mockResolvedValue({
      exitCode: 0,
      stdio: "",
      stdout: "8.0.204",
      stderr: "",
      proc: { pid: 0, output: "", stdout: "", stderr: "", stdin: "" },
    });
    const result = await _validateDotNetSdk(program, minVersion);
    expect(result).toBe(true);
    /* no diagnostics */
    strictEqual(program.diagnostics.length, 0);
  });

  it("should return true for installed SDK version whose major greaters than min supported version", async () => {
    /* mock the scenario that the installed SDK version whose major greater than min supported version */
    (execAsync as Mock).mockImplementation(
      (command: string, args: string[] = [], options: SpawnOptions = {}) => {
        return {
          exitCode: 0,
          stdio: "",
          stdout: "9.0.102",
          stderr: "",
          proc: { pid: 0, output: "", stdout: "", stderr: "", stdin: "" },
        };
      },
    );
    const result = await _validateDotNetSdk(program, minVersion);
    expect(result).toBe(true);
    /* no diagnostics */
    strictEqual(program.diagnostics.length, 0);
  });

  it("should return false and report diagnostic for invalid .NET SDK version", async () => {
    /* mock the scenario that the installed SDK version whose major less than min supported version */
    (execAsync as Mock).mockResolvedValue({
      exitCode: 0,
      stdio: "",
      stdout: "5.0.408",
      stderr: "",
      proc: { pid: 0, output: "", stdout: "", stderr: "", stdin: "" },
    });
    const result = await _validateDotNetSdk(program, minVersion);
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
