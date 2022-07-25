import { BasicTestRunner } from "@cadl-lang/compiler/testing";
import { createViewerTestRunner } from "./test-host.js";

describe("Smoke tests", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createViewerTestRunner();
  });

  it("create html view", async () => {
    await runner.compile(`op foo(): string;`);
  });
});
