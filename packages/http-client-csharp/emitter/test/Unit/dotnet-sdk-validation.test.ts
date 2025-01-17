import { Program } from "@typespec/compiler";
import { TestHost } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { beforeEach, describe, expect, it } from "vitest";
import { validateDotNetSdkVersion } from "../../src/emitter.js";
import { createEmitterTestHost, typeSpecCompile } from "./utils/test-util.js";

describe("Test validateDotNetSdkVersion", () => {
  let runner: TestHost;
  let program: Program;
  const minVersion = 8;

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

  it("should return true for installed SDK version whose major equals min supported version", async () => {
    const result = validateDotNetSdkVersion(program, "8.0.204", minVersion);
    expect(result).toBe(true);
    /* no diagnostics */
    strictEqual(program.diagnostics.length, 0);
  });

  it("should return true for installed SDK version whose major greaters than min supported version", async () => {
    const result = validateDotNetSdkVersion(program, "9.0.102", minVersion);
    expect(result).toBe(true);
    /* no diagnostics */
    strictEqual(program.diagnostics.length, 0);
  });

  it("should return false for invalid .NET SDK version", async () => {
    const result = validateDotNetSdkVersion(program, "5.0.408", minVersion);
    expect(result).toBe(false);
    strictEqual(program.diagnostics.length, 1);
    strictEqual(
      program.diagnostics[0].code,
      "@typespec/http-client-csharp/invalid-dotnet-sdk-dependency",
    );
    strictEqual(
      program.diagnostics[0].message,
      "The .NET SDK found is version 5.0.408. Please install the .NET SDK 8 or above and ensure there is no global.json in the file system requesting a lower version.  Guidance for installing the .NET SDK can be found at https://dotnet.microsoft.com/",
    );
  });
});
