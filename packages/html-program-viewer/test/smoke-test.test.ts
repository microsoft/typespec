import { BasicTestRunner } from "@typespec/compiler/testing";
import { createViewerTestRunner } from "./test-host.js";

describe("html-program-viewer: smoke tests", () => {
  let runner: BasicTestRunner;

  beforeEach(async () => {
    runner = await createViewerTestRunner();
  });

  it("create html view", async () => {
    await runner.compile(`op foo(): string;`);
  });
});
