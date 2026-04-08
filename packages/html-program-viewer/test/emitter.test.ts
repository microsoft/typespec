import { it } from "vitest";
import { Tester } from "./test-host.js";

const EmitterTester = Tester.emit("@typespec/html-program-viewer");

it("runs emitter", async () => {
  await EmitterTester.compile(`op foo(): string;`);
});
