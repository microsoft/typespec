import { describe, it } from "vitest";
import { expectDiagnostics } from "../../src/testing/index.js";
import { Tester } from "../tester.js";

describe("compiler: semantic checks on source with parse errors", () => {
  it("reports semantic errors in addition to parse errors", async () => {
    const diagnostics = await Tester.diagnose(`model M extends Q {
        a: B;
        a: C;
      `);
    expectDiagnostics(diagnostics, [
      { message: /'}' expected/ },
      { message: /Unknown identifier Q/ },
      { message: /Unknown identifier B/ },
      { message: /Unknown identifier C/ },
      { message: /Model M already has a property named a/ },
    ]);
  });
});
