import { beforeEach, describe, expect, it, vi } from "vitest";
import { createBrowserHost } from "../src/browser-host.js";

const importLibrary = vi.hoisted(() => vi.fn());

vi.mock("../src/core.js", async (importOriginal) => {
  const original = await importOriginal<typeof import("../src/core.js")>();
  return { ...original, importLibrary, importTypeSpecCompiler: async () => ({}) as any };
});

function fakeLibrary(name: string, { emitter }: { emitter: boolean }) {
  return {
    $lib: { emitter },
    _TypeSpecLibrary_: {
      typespecSourceFiles: {
        "package.json": JSON.stringify({ name, version: "1.2.3" }),
        "main.tsp": `// ${name}`,
      },
      jsSourceFiles: {},
    },
  };
}

describe("createBrowserHost deferred emitters", () => {
  beforeEach(() => {
    importLibrary.mockReset();
    importLibrary.mockImplementation(async (name: string) =>
      fakeLibrary(name, { emitter: name === "@typespec/emitter" }),
    );
  });

  it("does not import deferred emitters when the host is created", async () => {
    const host = await createBrowserHost(
      ["@typespec/http", "@typespec/emitter"],
      {},
      {
        deferredEmitters: ["@typespec/emitter"],
      },
    );

    expect(importLibrary.mock.calls.map((x) => x[0])).toEqual(["@typespec/http"]);
    // The emitter is still offered in the UI so it can be selected.
    expect(host.libraries["@typespec/emitter"]).toMatchObject({
      name: "@typespec/emitter",
      isEmitter: true,
      deferred: true,
    });
  });

  it("leaves deferred emitters out of the virtual package.json until they are loaded", async () => {
    const host = await createBrowserHost(
      ["@typespec/http", "@typespec/emitter"],
      {},
      {
        deferredEmitters: ["@typespec/emitter"],
      },
    );

    const before = JSON.parse((await host.readFile("/test/package.json")).text);
    expect(Object.keys(before.dependencies)).toEqual(["@typespec/http"]);

    await host.loadLibrary("@typespec/emitter");

    const after = JSON.parse((await host.readFile("/test/package.json")).text);
    expect(Object.keys(after.dependencies).sort()).toEqual(["@typespec/emitter", "@typespec/http"]);
  });

  it("imports and registers a deferred emitter on loadLibrary", async () => {
    const host = await createBrowserHost(
      ["@typespec/emitter"],
      {},
      {
        deferredEmitters: ["@typespec/emitter"],
      },
    );

    await expect(host.readFile("/test/node_modules/@typespec/emitter/main.tsp")).rejects.toThrow();

    await host.loadLibrary("@typespec/emitter");

    const file = await host.readFile("/test/node_modules/@typespec/emitter/main.tsp");
    expect(file.text).toEqual("// @typespec/emitter");
    expect(host.libraries["@typespec/emitter"].deferred).toBeUndefined();
    expect(host.libraries["@typespec/emitter"].packageJson.version).toEqual("1.2.3");
  });

  it("imports a deferred emitter only once across concurrent calls", async () => {
    const host = await createBrowserHost(
      ["@typespec/emitter"],
      {},
      {
        deferredEmitters: ["@typespec/emitter"],
      },
    );

    await Promise.all([
      host.loadLibrary("@typespec/emitter"),
      host.loadLibrary("@typespec/emitter"),
    ]);
    await host.loadLibrary("@typespec/emitter");

    expect(importLibrary.mock.calls.filter((x) => x[0] === "@typespec/emitter")).toHaveLength(1);
  });

  it("retries a deferred emitter whose import failed", async () => {
    importLibrary.mockRejectedValueOnce(new Error("network boom"));
    const host = await createBrowserHost(
      ["@typespec/emitter"],
      {},
      {
        deferredEmitters: ["@typespec/emitter"],
      },
    );

    await expect(host.loadLibrary("@typespec/emitter")).rejects.toThrow("network boom");

    await host.loadLibrary("@typespec/emitter");
    expect(host.libraries["@typespec/emitter"].deferred).toBeUndefined();
  });

  it("resolves immediately for libraries that are not deferred", async () => {
    const host = await createBrowserHost(["@typespec/http"], {}, {});

    await host.loadLibrary("@typespec/http");
    expect(importLibrary.mock.calls.filter((x) => x[0] === "@typespec/http")).toHaveLength(1);
  });
});
