import { strictEqual } from "assert";
import { compileAndDiagnose } from "./testHost.js";

describe("openapi: decorators", () => {
  describe("@operationId", () => {
    it("emit diagnostic if use on non operation", async () => {
      const [_, diagnostics] = await compileAndDiagnose(`
        @operationId("foo")
        model Foo {
          
        }
      `);

      strictEqual(diagnostics.length, 1);
      strictEqual(diagnostics[0].code, "@cadl-lang/openapi/decorator-wrong-type");
      strictEqual(diagnostics[0].message, "Cannot use @operationId on a Model");
    });
  });
});
