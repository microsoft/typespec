import { expectDiagnostics, t } from "@typespec/compiler/testing";
import { afterEach, describe, expect, it, vi } from "vitest";
import pkgJson from "../../package.json" with { type: "json" };
import { emitCodeModel } from "./test-host.js";

const loadPyodide = vi.hoisted(() => vi.fn());
vi.mock("../src/pyodide-loader.js", () => ({ loadPyodide }));

it("targets the service namespace when no SDK clients are found", async () => {
  const { diagnostics } = await emitCodeModel(t.code`
    #suppress "@typespec/http-client-python/no-sdk-clients" "This service intentionally has no client."
    @service namespace ${t.namespace("Service")} {}
  `);

  expectDiagnostics(diagnostics, []);
});

it("generates models when no service exists", async () => {
  const { codeModel, diagnostics } = await emitCodeModel(`
    import "@azure-tools/typespec-client-generator-core";
    using Azure.ClientGenerator.Core;

    #suppress "@typespec/http-client-python/no-sdk-clients" "This model-only package intentionally has no client."
    @access(Access.public)
    @usage(Usage.input | Usage.output)
    @clientNamespace("Models")
    model Widget {}
  `);

  expectDiagnostics(diagnostics, []);
  // A model-only package has no clients but must still emit its models into the code model.
  expect(codeModel.clients).toHaveLength(0);
  expect(codeModel.types.some((type) => type.type === "model" && type.name === "Widget")).toBe(
    true,
  );
});

describe("browser Python runtime", () => {
  async function emitInBrowser() {
    // Each emit must start without the module-cached Pyodide instance.
    vi.resetModules();
    vi.stubGlobal("window", {});
    const { EmitterTester } = await import("./test-host.js");
    const [, diagnostics] = await EmitterTester.compileAndDiagnose(
      "@service namespace Service { op read(): string; }",
    );
    return diagnostics;
  }

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("keeps the public CDN and package resolution when they are available", async () => {
    const micropip = { install: vi.fn().mockResolvedValue(undefined) };
    const pyodide = {
      FS: {
        mkdirTree: vi.fn(),
        writeFile: vi.fn(),
        readdir: vi.fn().mockReturnValue([".", ".."]),
      },
      loadPackage: vi.fn().mockResolvedValue(undefined),
      pyimport: vi.fn().mockReturnValue(micropip),
      toPy: vi.fn().mockReturnValue({ destroy: vi.fn() }),
      runPythonAsync: vi.fn().mockResolvedValue(undefined),
    };
    loadPyodide.mockResolvedValue(pyodide);
    const fetchAssets = vi.fn();
    vi.stubGlobal("fetch", fetchAssets);

    expectDiagnostics(await emitInBrowser(), []);

    expect(loadPyodide).toHaveBeenCalledExactlyOnceWith({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pkgJson.dependencies.pyodide}/full/`,
    });
    expect(pyodide.loadPackage).toHaveBeenCalledExactlyOnceWith("micropip");
    expect(micropip.install).toHaveBeenCalledExactlyOnceWith(
      `https://typespec.blob.core.windows.net/pkgs/@typespec/http-client-python/${pkgJson.version}/generator/dist/pygen-0.1.0-py3-none-any.whl`,
    );
    expect(fetchAssets).not.toHaveBeenCalled();
    expect(pyodide.runPythonAsync).toHaveBeenCalledOnce();
  });

  it("installs published wheels when the public CDN is unavailable", async () => {
    const globals = { destroy: vi.fn() };
    const pyodide = {
      FS: {
        mkdirTree: vi.fn(),
        writeFile: vi.fn(),
        readdir: vi.fn().mockReturnValue([".", ".."]),
      },
      loadPackage: vi.fn().mockResolvedValue(undefined),
      toPy: vi.fn().mockReturnValue(globals),
      runPythonAsync: vi.fn().mockResolvedValue(undefined),
    };
    loadPyodide.mockRejectedValueOnce(new Error("CDN unavailable")).mockResolvedValueOnce(pyodide);
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

    const diagnostics = await emitInBrowser();
    expectDiagnostics(diagnostics, []);

    const base = `https://typespec.blob.core.windows.net/pkgs/@typespec/http-client-python/${pkgJson.version}`;
    expect(loadPyodide).toHaveBeenNthCalledWith(1, {
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${pkgJson.dependencies.pyodide}/full/`,
    });
    expect(loadPyodide).toHaveBeenNthCalledWith(2, {
      indexURL: `${base}/generator/dist/pyodide/`,
    });
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

  it("installs published wheels into the existing runtime when public package resolution fails", async () => {
    const globals = { destroy: vi.fn() };
    const micropip = { install: vi.fn().mockRejectedValue(new Error("PyPI unavailable")) };
    const pyodide = {
      FS: {
        mkdirTree: vi.fn(),
        writeFile: vi.fn(),
        readdir: vi.fn().mockReturnValue([".", ".."]),
      },
      loadPackage: vi.fn().mockResolvedValue(undefined),
      pyimport: vi.fn().mockReturnValue(micropip),
      toPy: vi.fn().mockReturnValue(globals),
      runPythonAsync: vi.fn().mockResolvedValue(undefined),
    };
    loadPyodide.mockResolvedValue(pyodide);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          generator: ["black-26.3.1-py3-none-any.whl"],
          pyodide: [
            "packaging-23.2-py3-none-any.whl",
            "micropip-0.6.0-py3-none-any.whl",
            "click-8.1.7-py3-none-any.whl",
            "pyyaml-6.0.1-py3-none-any.whl",
            "markupsafe-2.1.5-py3-none-any.whl",
          ],
        }),
      }),
    );

    expectDiagnostics(await emitInBrowser(), []);
    expect(loadPyodide).toHaveBeenCalledOnce();
    expect(micropip.install).toHaveBeenCalledOnce();
    expect(pyodide.loadPackage).toHaveBeenCalledWith([
      expect.stringContaining("/pyodide-wheels/packaging-23.2-py3-none-any.whl"),
      expect.stringContaining("/pyodide-wheels/micropip-0.6.0-py3-none-any.whl"),
    ]);
    expect(pyodide.runPythonAsync.mock.calls[0][0]).toContain("deps=False");
  });

  it("reports a missing hosted wheel manifest after the CDN fails", async () => {
    loadPyodide
      .mockRejectedValueOnce(new Error("CDN unavailable"))
      .mockResolvedValueOnce({ FS: { mkdirTree: vi.fn() }, loadPackage: vi.fn() });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 404 }));

    expectDiagnostics(await emitInBrowser(), {
      code: "@typespec/http-client-python/unknown-error",
      message: /Failed to load browser Python wheels: 404/,
    });
  });

  it("reports both errors if the CDN and hosted runtime fail", async () => {
    loadPyodide
      .mockRejectedValueOnce(new Error("CDN unavailable"))
      .mockRejectedValueOnce(new Error("Hosted runtime unavailable"));

    expectDiagnostics(await emitInBrowser(), {
      code: "@typespec/http-client-python/unknown-error",
      message: /CDN unavailable.*Hosted runtime unavailable/,
    });
  });

  it.each([
    {
      name: "invalid wheel filenames",
      manifest: {
        generator: ["../../black.whl"],
        pyodide: ["packaging-23.2-py3-none-any.whl", "micropip-0.6.0-py3-none-any.whl"],
      },
    },
    {
      name: "incomplete Pyodide assets",
      manifest: {
        generator: ["black-26.3.1-py3-none-any.whl"],
        pyodide: ["micropip-0.6.0-py3-none-any.whl"],
      },
    },
  ])("rejects $name without installing anything", async ({ manifest }) => {
    const loadPackage = vi.fn();
    const runPythonAsync = vi.fn();
    loadPyodide
      .mockRejectedValueOnce(new Error("CDN unavailable"))
      .mockResolvedValueOnce({ FS: { mkdirTree: vi.fn() }, loadPackage, runPythonAsync });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => manifest,
      }),
    );

    expectDiagnostics(await emitInBrowser(), {
      code: "@typespec/http-client-python/unknown-error",
      message: /Invalid browser Python wheel manifest/,
    });
    expect(loadPackage).not.toHaveBeenCalled();
    expect(runPythonAsync).not.toHaveBeenCalled();
  });
});
