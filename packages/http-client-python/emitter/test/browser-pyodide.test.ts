import { strictEqual } from "assert";
import { afterEach, describe, expect, it, vi } from "vitest";

const loadPyodide = vi.hoisted(() => vi.fn());

vi.mock("../src/pyodide-loader.js", () => ({ loadPyodide }));

describe("typespec-python: browser pyodide bootstrap", () => {
  afterEach(() => {
    delete (globalThis as any).window;
    loadPyodide.mockReset();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  // Hosts like the TypeSpec playground import every available emitter up front. Booting Pyodide at
  // module scope downloaded a full CPython WebAssembly runtime on every page load, which pushed the
  // page past the per-tab memory budget on mobile browsers and prevented it from loading.
  it("does not boot pyodide when the emitter is imported in a browser", async () => {
    (globalThis as any).window = globalThis;

    await import("../src/emitter.js");

    strictEqual(loadPyodide.mock.calls.length, 0);
  }, 15_000);

  it("retries the hosted script when the CDN script fails", async () => {
    const appendChild = vi.fn(
      (script: { src: string; onload: (() => void) | null; onerror: (() => void) | null }) => {
        if (script.src.includes("cdn.jsdelivr.net")) {
          queueMicrotask(() => script.onerror?.());
        } else {
          vi.stubGlobal("loadPyodide", vi.fn().mockResolvedValue({}));
          queueMicrotask(() => script.onload?.());
        }
      },
    );
    vi.stubGlobal("document", {
      createElement: () => ({ src: "", onload: null, onerror: null }),
      head: { appendChild },
    });
    const { loadPyodide: loadBrowserPyodide } = await import("../src/pyodide-loader.browser.js");

    await expect(
      loadBrowserPyodide({ indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/" }),
    ).rejects.toThrow("Failed to load pyodide");
    await expect(
      loadBrowserPyodide({ indexURL: "https://typespec.blob.core.windows.net/pyodide/" }),
    ).resolves.toEqual({});
    expect(appendChild).toHaveBeenCalledTimes(2);
  });
});
