import { beforeEach, describe, it } from "vitest";
import { CompilerOptions } from "../src/index.js";
import { expectDiagnosticEmpty } from "../src/testing/index.js";
import { createTestRunner } from "../src/testing/test-host.js";
import { BasicTestRunner } from "../src/testing/types.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createTestRunner();
});

const intrinsicTypes = [
  "string",
  "int8",
  "int16",
  "int32",
  "int64",
  "uint64",
  "decimal",
  "Array<string>",
  "Record<string>",
  "string[]",
];

describe("with stdlib", () => {
  const options: CompilerOptions = { nostdlib: false };
  it("compiles", async () => {
    const diagnostics = await runner.diagnose(`model Bar {}`, options);
    expectDiagnosticEmpty(diagnostics);
  });

  describe("can use intrinsic types", () => {
    it.each(intrinsicTypes)("%s", async (type) => {
      const diagnostics = await runner.diagnose(`model Foo { name: ${type}; }`, options);
      expectDiagnosticEmpty(diagnostics);
    });
  });
  describe("can stdlib types", () => {
    it.each(["url", "unixTimestamp32"])("%s", async (type) => {
      const diagnostics = await runner.diagnose(`model Foo { name: ${type}; }`, options);
      expectDiagnosticEmpty(diagnostics);
    });
  });
});

describe("without stdlib(--nostdlib)", () => {
  const options: CompilerOptions = { nostdlib: true };

  it("compiles", async () => {
    const diagnostics = await runner.diagnose(`model Bar {}`, options);
    expectDiagnosticEmpty(diagnostics);
  });

  describe("can use intrinsic types", () => {
    it.each(intrinsicTypes)("%s", async (type) => {
      const diagnostics = await runner.diagnose(`model Foo { name: ${type}; }`, options);
      expectDiagnosticEmpty(diagnostics);
    });
  });
});
