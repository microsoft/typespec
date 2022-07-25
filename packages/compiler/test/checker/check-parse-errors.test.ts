import { match, strictEqual } from "assert";
import { createTestHost, TestHost } from "../../testing/index.js";

describe("compiler: semantic checks on source with parse errors", () => {
  let testHost: TestHost;

  beforeEach(async () => {
    testHost = await createTestHost();
  });

  it("reports semantic errors in addition to parse errors", async () => {
    testHost.addCadlFile(
      "main.cadl",
      `model M extends Q {
        a: B;
        a: C;
      `
    );

    const diagnostics = await testHost.diagnose("./");
    strictEqual(diagnostics.length, 5);
    match(diagnostics[0].message, /'}' expected/);
    match(diagnostics[1].message, /Unknown identifier Q/);
    match(diagnostics[2].message, /Unknown identifier B/);
    match(diagnostics[3].message, /Unknown identifier C/);
    match(diagnostics[4].message, /Model already has a property named a/);
  });
});
