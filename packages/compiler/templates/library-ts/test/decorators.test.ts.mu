import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import type { Operation, Program } from "@typespec/compiler";
import { expectDiagnostics } from "@typespec/compiler/testing";
import { getAlternateName } from "../src/decorators.js";
import { Tester } from "./test-host.js";

describe("decorators", () => {
  describe("@alternateName", () => {
    it("set alternate name on operation", async () => {
      const { test, program } = (await Tester.compile(`
        using {{#casing.pascalCase}}{{name}}{{/casing.pascalCase}};
        @alternateName("bar") @test op test(): void;
      `)) as unknown as { test: Operation; program: Program };
      strictEqual(getAlternateName(program, test), "bar");
    });

    it("emit diagnostic if not used on an operation", async () => {
      const diagnostics = await Tester.diagnose(`
        using {{#casing.pascalCase}}{{name}}{{/casing.pascalCase}};
        @alternateName("bar") model Test {}
      `);
      expectDiagnostics(diagnostics, {
        severity: "error",
        code: "decorator-wrong-target",
        message: "Cannot apply @alternateName decorator to Test since it is not assignable to Operation"
      })
    });


    it("emit diagnostic if using banned name", async () => {
      const diagnostics = await Tester.diagnose(`
        using {{#casing.pascalCase}}{{name}}{{/casing.pascalCase}};
        @alternateName("banned") op test(): void;
      `);
      expectDiagnostics(diagnostics, {
        severity: "error",
        code: "{{name}}/banned-alternate-name",
        message: `Banned alternate name "banned".`
      })
    });
  });
});
