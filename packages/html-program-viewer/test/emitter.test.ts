import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach, it } from "vitest";
import { createViewerTestRunner } from "./test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createViewerTestRunner();
});

it("runs emitter", async () => {
  await runner.compile(`op foo(): string;`, {
    emitters: { "@typespec/html-program-viewer": {} },
  });
});
