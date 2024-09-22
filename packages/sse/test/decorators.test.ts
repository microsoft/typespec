import type { BasicTestRunner } from "@typespec/compiler/testing";
import { beforeEach } from "vitest";
import { createSSETestRunner } from "./test-host.js";

let runner: BasicTestRunner;

beforeEach(async () => {
  runner = await createSSETestRunner();
});
