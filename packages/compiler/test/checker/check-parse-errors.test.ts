import { beforeEach, describe, it } from "vitest";
import { TestHost, createTestHost, expectDiagnostics } from "../../src/testing/index.js";

describe("compiler: semantic checks on source with parse errors", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("reports semantic errors in addition to parse errors", async () => {
    testHost.addTypeSpecFile(
      "main.tsp",
      `model M extends Q {
        a: B;
        a: C;
      `,
    );

    const diagnostics = await testHost.diagnose("./");
    expectDiagnostics(diagnostics, [
      { message: /'}' expected/ },
      { message: /Unknown identifier Q/ },
      { message: /Unknown identifier B/ },
      { message: /Unknown identifier C/ },
      { message: /Model already has a property named a/ },
    ]);
  });
});
