import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createBrowserHostInternal,
  splitDeferredLibraries,
  type LoadedPlaygroundTspLibrary,
} from "../src/browser-host.js";

function fakeLibrary(name: string): LoadedPlaygroundTspLibrary {
  return {
    name,
    isEmitter: true,
    definition: { emitter: true } as any,
    packageJson: { name, version: "1.2.3" } as any,
    _TypeSpecLibrary_: {
      typespecSourceFiles: {
        "package.json": JSON.stringify({ name, version: "1.2.3" }),
        "main.tsp": `// ${name}`,
      },
      jsSourceFiles: {},
    },
  };
}

const emitterName = "@typespec/emitter";

describe("splitDeferredLibraries", () => {
  it("keeps everything eager when nothing is deferred", () => {
    expect(splitDeferredLibraries(["@typespec/http", emitterName])).toEqual({
      eager: ["@typespec/http", emitterName],
      deferred: [],
    });
  });

  it("moves the requested libraries to the deferred list", () => {
    expect(splitDeferredLibraries(["@typespec/http", emitterName], [emitterName])).toEqual({
      eager: ["@typespec/http"],
      deferred: [emitterName],
    });
  });

  it("ignores deferred names that are not loaded at all", () => {
    expect(splitDeferredLibraries(["@typespec/http"], ["@typespec/not-in-import-map"])).toEqual({
      eager: ["@typespec/http"],
      deferred: [],
    });
  });
});

describe("browser host deferred libraries", () => {
  let loader: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loader = vi.fn(async () => fakeLibrary(emitterName));
  });

  function createHost() {
    return createBrowserHostInternal({
      compiler: {} as any,
      libraries: { "@typespec/http": fakeLibrary("@typespec/http") },
      deferredLibraries: { [emitterName]: loader as any },
    });
  }

  it("does not import deferred libraries when the host is created", () => {
    const host = createHost();

    expect(loader).not.toHaveBeenCalled();
    // The emitter is still offered in the UI so it can be selected.
    expect(host.libraries[emitterName]).toMatchObject({
      name: emitterName,
      isEmitter: true,
      deferred: true,
    });
  });

  it("leaves deferred libraries out of the virtual package.json until they are loaded", async () => {
    const host = createHost();

    const before = JSON.parse((await host.readFile("/test/package.json")).text);
    expect(Object.keys(before.dependencies)).toEqual(["@typespec/http"]);

    await host.loadLibrary(emitterName);

    const after = JSON.parse((await host.readFile("/test/package.json")).text);
    expect(Object.keys(after.dependencies).sort()).toEqual([emitterName, "@typespec/http"]);
  });

  it("registers the library files on loadLibrary", async () => {
    const host = createHost();

    await expect(
      host.readFile(`/test/node_modules/${emitterName}/main.tsp`),
    ).rejects.toThrowError();

    await host.loadLibrary(emitterName);

    const file = await host.readFile(`/test/node_modules/${emitterName}/main.tsp`);
    expect(file.text).toEqual(`// ${emitterName}`);
    expect(host.libraries[emitterName].deferred).toBeUndefined();
    expect(host.libraries[emitterName].packageJson.version).toEqual("1.2.3");
  });

  it("imports a deferred library only once across concurrent calls", async () => {
    const host = createHost();

    await Promise.all([host.loadLibrary(emitterName), host.loadLibrary(emitterName)]);
    await host.loadLibrary(emitterName);

    expect(loader).toHaveBeenCalledTimes(1);
  });

  it("retries a deferred library whose import failed", async () => {
    loader.mockRejectedValueOnce(new Error("network boom"));
    const host = createHost();

    await expect(host.loadLibrary(emitterName)).rejects.toThrowError("network boom");

    await host.loadLibrary(emitterName);
    expect(host.libraries[emitterName].deferred).toBeUndefined();
    expect(loader).toHaveBeenCalledTimes(2);
  });

  it("resolves immediately for libraries that are not deferred", async () => {
    const host = createHost();

    await host.loadLibrary("@typespec/http");
    expect(loader).not.toHaveBeenCalled();
  });
});
