import { expectDiagnostics } from "@typespec/compiler/testing";
import { strictEqual } from "assert";
import { afterEach, describe, expect, it, vi } from "vitest";
import pkgJson from "../../package.json" with { type: "json" };

const loadPyodide = vi.hoisted(() => vi.fn());

vi.mock("../src/pyodide-loader.js", () => ({ loadPyodide }));

describe("typespec-python: browser pyodide bootstrap", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    loadPyodide.mockReset();
    vi.resetModules();
  });

  it("does not load a browser runtime outside the browser", async () => {
    const { getBrowserPyodide } = await import("../src/browser-runtime.js");

    strictEqual(getBrowserPyodide(), null);
    expect(loadPyodide).not.toHaveBeenCalled();
  });

  const assetsUrl = `https://typespec.blob.core.windows.net/pkgs/@typespec/http-client-python/${pkgJson.version}/generator/dist`;
  const wheels = [
    "packaging-23.2-py3-none-any.whl",
    "micropip-0.6.0-py3-none-any.whl",
    "PyYAML-6.0.1-py3-none-any.whl",
    "colorama-0.4.6-py2.py3-none-any.whl",
  ];

  function runtime() {
    return {
      FS: {
        mkdirTree: vi.fn(),
        writeFile: vi.fn(),
        readdir: vi.fn().mockReturnValue([".", ".."]),
      },
      loadPackage: vi.fn().mockResolvedValue(undefined),
      pyimport: vi.fn().mockReturnValue({
        install: Object.assign(vi.fn().mockResolvedValue(undefined), {
          callKwargs: vi.fn().mockResolvedValue(undefined),
        }),
      }),
      toPy: vi.fn().mockReturnValue({ destroy: vi.fn() }),
      runPythonAsync: vi.fn().mockResolvedValue(undefined),
    };
  }

  async function emit() {
    vi.resetModules();
    vi.stubGlobal("window", globalThis);
    const { EmitterTester } = await import("./test-host.js");
    const [, diagnostics] = await EmitterTester.compileAndDiagnose(
      "@service namespace Service { op read(): string; }",
    );
    return diagnostics;
  }

  it("does not request fallback assets when public packages are available", async () => {
    const pyodide = runtime();
    loadPyodide.mockResolvedValue(pyodide);
    const fetchAssets = vi.fn();
    vi.stubGlobal("fetch", fetchAssets);

    expectDiagnostics(await emit(), []);
    expect(loadPyodide).toHaveBeenCalledExactlyOnceWith({
      indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.2/full/",
    });
    expect(pyodide.loadPackage).toHaveBeenCalledExactlyOnceWith("micropip");
    expect(pyodide.pyimport().install).toHaveBeenCalledExactlyOnceWith(
      `${assetsUrl}/pygen-0.1.0-py3-none-any.whl`,
    );
    expect(fetchAssets).not.toHaveBeenCalled();
  });

  it("loads hosted runtime and CFS-built wheels after a CDN failure", async () => {
    const pyodide = runtime();
    loadPyodide.mockRejectedValueOnce(new Error("CDN blocked")).mockResolvedValueOnce(pyodide);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => wheels }));

    expectDiagnostics(await emit(), []);
    expect(loadPyodide).toHaveBeenNthCalledWith(2, { indexURL: `${assetsUrl}/pyodide/` });
    expect(pyodide.loadPackage).toHaveBeenCalledWith([
      `${assetsUrl}/browser-wheels/${wheels[0]}`,
      `${assetsUrl}/browser-wheels/${wheels[1]}`,
    ]);
    expect(pyodide.pyimport().install.callKwargs).toHaveBeenCalledExactlyOnceWith(
      [
        ...wheels.slice(2).map((name) => `${assetsUrl}/browser-wheels/${name}`),
        `${assetsUrl}/pygen-0.1.0-py3-none-any.whl`,
      ],
      { deps: false },
    );
  });

  it("reuses the runtime when loading public micropip fails", async () => {
    const pyodide = runtime();
    pyodide.loadPackage.mockRejectedValueOnce(new Error("Package CDN blocked"));
    loadPyodide.mockResolvedValue(pyodide);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => wheels }));

    expectDiagnostics(await emit(), []);
    expect(loadPyodide).toHaveBeenCalledOnce();
    expect(pyodide.pyimport().install).not.toHaveBeenCalled();
    expect(pyodide.pyimport().install.callKwargs).toHaveBeenCalledOnce();
  });

  it("reuses the runtime after public Python package installation fails", async () => {
    const pyodide = runtime();
    pyodide.pyimport().install.mockRejectedValueOnce(new Error("PyPI blocked"));
    loadPyodide.mockResolvedValue(pyodide);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => wheels }));

    expectDiagnostics(await emit(), []);
    expect(loadPyodide).toHaveBeenCalledOnce();
    expect(pyodide.pyimport().install.callKwargs).toHaveBeenLastCalledWith(
      expect.arrayContaining([`${assetsUrl}/pygen-0.1.0-py3-none-any.whl`]),
      { deps: false },
    );
  });

  it.each([
    { ok: false, status: 404 },
    { ok: true, json: async () => ["../invalid.whl"] },
    { ok: true, json: async () => [wheels[1]] },
  ])("reports invalid or missing fallback wheels", async (response) => {
    const pyodide = runtime();
    loadPyodide.mockRejectedValueOnce(new Error("CDN blocked")).mockResolvedValueOnce(pyodide);
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(response));

    expectDiagnostics(await emit(), {
      code: "@typespec/http-client-python/unknown-error",
      message: /CDN blocked.*(?:404|Invalid browser Python wheel manifest)/s,
    });
    expect(pyodide.pyimport().install).not.toHaveBeenCalled();
    expect(pyodide.pyimport().install.callKwargs).not.toHaveBeenCalled();
  });

  it("reports both failures when the public and hosted runtimes cannot load", async () => {
    loadPyodide
      .mockRejectedValueOnce(new Error("CDN blocked"))
      .mockRejectedValueOnce(new Error("Hosted runtime unavailable"));

    expectDiagnostics(await emit(), {
      code: "@typespec/http-client-python/unknown-error",
      message: /CDN blocked.*Hosted runtime unavailable/s,
    });
  });
});
