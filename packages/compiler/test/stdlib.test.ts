import { beforeEach, describe, it } from "vitest";
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
  it("compiles", async () => {
    const diagnostics = await runner.diagnose(`model Bar {}`, { nostdlib: false });
    expectDiagnosticEmpty(diagnostics);
  });

  describe("can use intrinsic types", () => {
    it.each(intrinsicTypes)("%s", async (type) => {
      const diagnostics = await runner.diagnose(`model Foo { name: ${type}; }`, { nostdlib: true });
      expectDiagnosticEmpty(diagnostics);
    });
  });
  describe("can stdlib types", () => {
    it.each(["url", "unixTimestamp32"])("%s", async (type) => {
      const diagnostics = await runner.diagnose(`model Foo { name: ${type}; }`, { nostdlib: true });
      expectDiagnosticEmpty(diagnostics);
    });
  });
});

describe("without stdlib(--nostdlib)", () => {
  it("compiles", async () => {
    const diagnostics = await runner.diagnose(`model Bar {}`, { nostdlib: true });
    expectDiagnosticEmpty(diagnostics);
  });

  describe("can use intrinsic types", () => {
    it.each(intrinsicTypes)("%s", async (type) => {
      const diagnostics = await runner.diagnose(`model Foo { name: ${type}; }`, { nostdlib: true });
      expectDiagnosticEmpty(diagnostics);
    });
  });
});
