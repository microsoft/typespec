import { expectDiagnostics } from "@typespec/compiler/testing";
import { describe, expect, it } from "vitest";
import { Tester as BaseTester } from "./test-host.js";

const Tester = BaseTester.importLibraries().using("Protobuf");

describe("@package name", () => {
  it.each([
    "../../outside/pwn",
    String.raw`..\..\outside\pwn`,
    "/outside/pwn",
    "C:/outside/pwn",
    String.raw`\\server\share\pwn`,
  ])("rejects unsafe package name %s", async (name) => {
    const result = await Tester.emit("@typespec/protobuf").compileAndDiagnose(`
      @package({ name: "${name.replaceAll("\\", "\\\\")}" })
      namespace Test;
    `);

    expectDiagnostics(result[1], {
      code: "@typespec/protobuf/invalid-package-name",
      message: `${name} is not a valid package name (must consist of letters and numbers separated by ".")`,
    });
    expect(result[0].outputs).toEqual({});
  });

  it("allows valid dotted package names", async () => {
    const result = await Tester.emit("@typespec/protobuf").compile(`
      @package({ name: "_internal.azure_test.v1" })
      namespace Test;
    `);

    expect(result.outputs).toHaveProperty("_internal/azure_test/v1.proto");
  });
});
