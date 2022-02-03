import { createTestWrapper, TestRunner } from "@cadl-lang/compiler/testing";
import { strictEqual } from "assert";
import { createRestTestHost } from "./test-host.js";

describe("rest: http decorators", () => {
  let runner: TestRunner;

  beforeEach(async () => {
    const host = await createRestTestHost();

    runner = createTestWrapper(
      host,
      (code) => `
      import "@cadl-lang/rest";
      namespace TestNamespace; 
      using Cadl.Http;
    
      ${code}
      `
    );
  });

  describe("emit diagnostic if passing arguments to verb decorators", () => {
    ["get", "post", "put", "patch", "delete", "head"].forEach((verb) => {
      it(`@${verb}`, async () => {
        const diagnostics = await runner.diagnose(`
          @${verb}("/test") op test(): string;
        `);

        strictEqual(diagnostics.length, 1);
        strictEqual(diagnostics[0].code, "invalid-argument-count");
        strictEqual(diagnostics[0].message, "Expected 0 arguments, but got 1.");
      });
    });
  });
});
