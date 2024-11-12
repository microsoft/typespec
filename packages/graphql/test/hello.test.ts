import { strictEqual } from "node:assert";
import { describe, it } from "vitest";
import { emitSingleSchema } from "./test-host.js";

describe("hello", () => {
  it("emit output file with content hello world", async () => {
    const emitterContent = await emitSingleSchema(`op test(): void;`);
    strictEqual(emitterContent, "Hello world");
  });
});
