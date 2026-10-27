import assert from "assert";
import { describe, it } from "vitest";
import { createAssetEmitter, TypeEmitter } from "../src/index.js";
import { getHostForTypeSpecFile } from "./host.js";

async function createEmitter() {
  const host = await getHostForTypeSpecFile("");
  return createAssetEmitter(host.program, TypeEmitter, {
    emitterOutputDir: "/out",
    options: {},
  } as any);
}

describe("createSourceFile path", () => {
  it("resolve the path relative to the emitter output dir", async () => {
    const emitter = await createEmitter();
    assert.strictEqual(emitter.createSourceFile("output.ts").path, "/out/output.ts");
  });

  it("keep sub directories", async () => {
    const emitter = await createEmitter();
    assert.strictEqual(emitter.createSourceFile("src/models/a.ts").path, "/out/src/models/a.ts");
  });

  it("cannot escape the emitter output dir with ..", async () => {
    const emitter = await createEmitter();
    assert.strictEqual(emitter.createSourceFile("../../escaped.ts").path, "/out/escaped.ts");
  });

  it("cannot escape the emitter output dir with an absolute path", async () => {
    const emitter = await createEmitter();
    assert.strictEqual(emitter.createSourceFile("/etc/passwd").path, "/out/etc/passwd");
  });

  it("cannot escape the emitter output dir with windows separators", async () => {
    const emitter = await createEmitter();
    assert.strictEqual(emitter.createSourceFile("..\\..\\escaped.ts").path, "/out/escaped.ts");
  });
});
