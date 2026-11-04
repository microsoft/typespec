import { expectDiagnostics } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { afterEach, describe, expect, it, vi } from "vitest";

const loadPyodide = vi.hoisted(() => vi.fn());

vi.mock("../src/pyodide-loader.js", () => ({ loadPyodide }));

describe("typespec-python: browser pyodide bootstrap", () => {
  afterEach(() => {
    delete (globalThis as any).window;
    vi.unstubAllGlobals();
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

  it("installs published dependency wheels without querying a package index", async () => {
    vi.stubGlobal("window", globalThis);
    const wheels = ["pygen-0.1.0-py3-none-any.whl", "black-26.3.1-py3-none-any.whl"];
    const fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ wheels }),
    });
    vi.stubGlobal("fetch", fetch);
    const pyodide = {
      FS: {
        mkdirTree: vi.fn(),
        readdir: vi.fn().mockReturnValue([".", ".."]),
        writeFile: vi.fn(),
      },
      loadPackage: vi.fn(),
      toPy: vi.fn(),
      runPythonAsync: vi.fn(),
    };
    loadPyodide.mockResolvedValue(pyodide);
    const { EmitterTester } = await import("./test-host.js");
    const [, diagnostics] = await EmitterTester.compileAndDiagnose(`
      import "@typespec/http";
      using TypeSpec.Http;
      @service namespace Test;
      @get op read(): string;
    `);

    expectDiagnostics(diagnostics, []);
    expect(fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/generator\/dist\/browser\/manifest\.json$/),
    );
    expect(pyodide.loadPackage).toHaveBeenNthCalledWith(
      1,
      wheels.map((name) => expect.stringMatching(new RegExp(`/browser/${name}$`))),
      { errorCallback: expect.any(Function) },
    );
    expect(pyodide.loadPackage).toHaveBeenNthCalledWith(2, ["pyyaml", "markupsafe"], {
      errorCallback: expect.any(Function),
    });
    expect(pyodide.runPythonAsync).toHaveBeenCalledOnce();
  });

  it.each([
    { ok: false, status: 404, body: undefined, message: /HTTP 404/ },
    { ok: true, status: 200, body: null, message: /Invalid Python browser wheel/ },
    { ok: true, status: 200, body: {}, message: /Invalid Python browser wheel/ },
    {
      ok: true,
      status: 200,
      body: { wheels: [] },
      message: /Invalid Python browser wheel/,
    },
    {
      ok: true,
      status: 200,
      body: { wheels: "not-an-array" },
      message: /Invalid Python browser wheel/,
    },
    {
      ok: true,
      status: 200,
      body: { wheels: [null] },
      message: /Invalid Python browser wheel/,
    },
    {
      ok: true,
      status: 200,
      body: { wheels: [42] },
      message: /Invalid Python browser wheel/,
    },
    {
      ok: true,
      status: 200,
      body: { wheels: ["../unexpected.whl"] },
      message: /Invalid Python browser wheel/,
    },
  ])("reports unusable browser wheel manifests: $body", async ({ ok, status, body, message }) => {
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok, status, json: async () => body }));
    const loadPackage = vi.fn();
    loadPyodide.mockResolvedValue({
      FS: { mkdirTree: vi.fn() },
      loadPackage,
    });
    const { EmitterTester } = await import("./test-host.js");
    const [, diagnostics] = await EmitterTester.compileAndDiagnose(
      "@service namespace Test; op read(): string;",
    );

    expectDiagnostics(diagnostics, {
      code: "@typespec/http-client-python/unknown-error",
      message,
    });
    expect(loadPackage).not.toHaveBeenCalled();
  });

  it.each(["rejected", "reported"])(
    "reports %s wheel loading failures and retries initialization on the next emit",
    async (mode) => {
      vi.stubGlobal("window", globalThis);
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue({
          ok: true,
          json: async () => ({ wheels: ["pygen-0.1.0-py3-none-any.whl"] }),
        }),
      );
      const loadPackage = vi.fn().mockImplementationOnce((_names, options) => {
        if (mode === "rejected") return Promise.reject(new Error("Wheel download failed"));
        options?.errorCallback("Wheel download failed");
        return Promise.resolve([]);
      });
      loadPyodide.mockResolvedValue({
        FS: {
          mkdirTree: vi.fn(),
          readdir: vi.fn().mockReturnValue([".", ".."]),
          writeFile: vi.fn(),
        },
        loadPackage,
        toPy: vi.fn(),
        runPythonAsync: vi.fn(),
      });
      const { EmitterTester } = await import("./test-host.js");
      const source = "@service namespace Test; op read(): string;";
      const [, failure] = await EmitterTester.compileAndDiagnose(source);
      expectDiagnostics(failure, {
        code: "@typespec/http-client-python/unknown-error",
        message: /Wheel download failed/,
      });
      const [, success] = await EmitterTester.compileAndDiagnose(source);
      expectDiagnostics(success, []);
      expect(loadPyodide).toHaveBeenCalledTimes(2);
      expect(loadPackage).toHaveBeenCalledTimes(3);
    },
  );
});
