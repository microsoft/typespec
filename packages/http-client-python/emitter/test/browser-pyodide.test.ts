import { strictEqual } from "assert";
import { afterEach, describe, it, vi } from "vitest";

const loadPyodide = vi.hoisted(() => vi.fn());

vi.mock("../src/pyodide-loader.js", () => ({ loadPyodide }));

describe("typespec-python: browser pyodide bootstrap", () => {
  afterEach(() => {
    delete (globalThis as any).window;
    loadPyodide.mockReset();
    vi.resetModules();
  });

  // Hosts like the TypeSpec playground import every available emitter up front. Booting Pyodide at
  // module scope downloaded a full CPython WebAssembly runtime on every page load, which pushed the
  // page past the per-tab memory budget on mobile browsers and prevented it from loading.
  it("does not boot pyodide when the emitter is imported in a browser", async () => {
    (globalThis as any).window = globalThis;

    await import("../src/emitter.js");

    strictEqual(loadPyodide.mock.calls.length, 0);
  });
});
