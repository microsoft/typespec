import { BasicTestRunner, expectDiagnostics } from "@cadl-lang/compiler/testing";
import { createRestTestRunner } from "./test-host.js";

describe("rest: http decorators", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createRestTestRunner();
  });

  describe("emit diagnostic if passing arguments to verb decorators", () => {
    ["get", "post", "put", "patch", "delete", "head"].forEach((verb) => {
      it(`@${verb}`, async () => {
        const diagnostics = await runner.diagnose(`
          @${verb}("/test") op test(): string;
        `);

        expectDiagnostics(diagnostics, {
          code: "invalid-argument-count",
          message: "Expected 0 arguments, but got 1.",
        });
      });
    });
  });
});
