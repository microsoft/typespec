import { afterEach, describe, expect, it, vi } from "vitest";
import pkgJson from "../../package.json" with { type: "json" };

const loadPyodide = vi.hoisted(() => vi.fn());
vi.mock("../src/pyodide-loader.js", () => ({ loadPyodide }));

import { setupPyodideCallBrowser } from "../src/browser-runtime.js";

describe("browser Python runtime", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("installs published wheels without contacting the package index", async () => {
    const globals = { destroy: vi.fn() };
    const pyodide = {
      FS: { mkdirTree: vi.fn() },
      loadPackage: vi.fn().mockResolvedValue(undefined),
      toPy: vi.fn().mockReturnValue(globals),
      runPythonAsync: vi.fn().mockResolvedValue(undefined),
    };
    loadPyodide.mockResolvedValue(pyodide);
    const wheelNames = ["black-26.3.1-py3-none-any.whl", "jinja2-3.1.6-py3-none-any.whl"];
    const pyodideWheelNames = [
      "packaging-23.2-py3-none-any.whl",
      "micropip-0.6.0-py3-none-any.whl",
      "click-8.1.7-py3-none-any.whl",
      "pyyaml-6.0.1-py3-none-any.whl",
      "markupsafe-2.1.5-py3-none-any.whl",
    ];
    const fetchManifest = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ generator: wheelNames, pyodide: pyodideWheelNames }),
    });
    vi.stubGlobal("fetch", fetchManifest);

    expect(await setupPyodideCallBrowser()).toBe(pyodide);

    const base = `https://typespec.blob.core.windows.net/pkgs/@typespec/http-client-python/${pkgJson.version}`;
    expect(loadPyodide).toHaveBeenCalledWith({ indexURL: `${base}/generator/dist/pyodide/` });
    expect(fetchManifest).toHaveBeenCalledWith(`${base}/generator/dist/browser-wheels.json`);
    expect(pyodide.loadPackage).toHaveBeenCalledWith([
      `${base}/generator/dist/pyodide-wheels/packaging-23.2-py3-none-any.whl`,
      `${base}/generator/dist/pyodide-wheels/micropip-0.6.0-py3-none-any.whl`,
    ]);
    expect(pyodide.toPy).toHaveBeenCalledWith({
      pyodideWheelUrls: pyodideWheelNames
        .slice(2)
        .map((name) => `${base}/generator/dist/pyodide-wheels/${name}`),
      wheelUrls: wheelNames.map((name) => `${base}/generator/dist/browser-wheels/${name}`),
      generatorWheelUrl: `${base}/generator/dist/pygen-0.1.0-py3-none-any.whl`,
    });
    expect(pyodide.runPythonAsync).toHaveBeenCalledWith(
      expect.stringContaining("await micropip.install(generatorWheelUrl, deps=False)"),
      { globals },
    );
    expect(pyodide.runPythonAsync.mock.calls[0][0]).toContain(
      "await micropip.install(pyodideWheelUrls, deps=False)",
    );
    expect(pyodide.runPythonAsync.mock.calls[0][0]).toContain(
      "await micropip.install(wheelUrls, deps=False)",
    );
    expect(globals.destroy).toHaveBeenCalledOnce();
  });

  it("reports a missing wheel manifest instead of falling back to the package index", async () => {
    loadPyodide.mockResolvedValue({
      FS: { mkdirTree: vi.fn() },
      loadPackage: vi.fn().mockResolvedValue(undefined),
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    await expect(setupPyodideCallBrowser()).rejects.toThrow(
      "Failed to load browser Python wheels: 404",
    );
  });

  it("rejects invalid wheel filenames before installing anything", async () => {
    const runPythonAsync = vi.fn();
    loadPyodide.mockResolvedValue({
      FS: { mkdirTree: vi.fn() },
      loadPackage: vi.fn().mockResolvedValue(undefined),
      runPythonAsync,
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          generator: ["../../black.whl"],
          pyodide: ["packaging-23.2-py3-none-any.whl", "micropip-0.6.0-py3-none-any.whl"],
        }),
      }),
    );

    await expect(setupPyodideCallBrowser()).rejects.toThrow(
      "Invalid browser Python wheel manifest",
    );
    expect(runPythonAsync).not.toHaveBeenCalled();
  });

  it("rejects incomplete Pyodide assets instead of resolving missing packages externally", async () => {
    const loadPackage = vi.fn();
    loadPyodide.mockResolvedValue({ FS: { mkdirTree: vi.fn() }, loadPackage });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          generator: ["black-26.3.1-py3-none-any.whl"],
          pyodide: ["micropip-0.6.0-py3-none-any.whl"],
        }),
      }),
    );

    await expect(setupPyodideCallBrowser()).rejects.toThrow(
      "Invalid browser Python wheel manifest",
    );
    expect(loadPackage).not.toHaveBeenCalled();
  });
});
