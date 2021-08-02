import { match, strictEqual } from "assert";
import { createTestHost, TestHost } from "../test-host.js";

describe("cadl: semantic checks on source with parse errors", () => {
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

    const diagnostics = await testHost.diagnose("/");
    strictEqual(diagnostics.length, 4);
    match(diagnostics[0].message, /Property expected/);
    match(diagnostics[1].message, /Unknown identifier Q/);
    match(diagnostics[2].message, /Unknown identifier B/);
    match(diagnostics[3].message, /Unknown identifier C/);
  });
});
