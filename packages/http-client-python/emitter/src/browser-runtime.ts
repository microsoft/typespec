import pkgJson from "../../package.json" with { type: "json" };
import {
  BLOB_STORAGE_BASE_URL,
  PACKAGE_NAME,
  PYGEN_WHEEL_FILENAME,
  PYODIDE_VERSION,
} from "./constants.js";
import type { PyodideInterface } from "./pyodide-loader.js";
import { loadPyodide } from "./pyodide-loader.js";

function getBrowserPygenWheelUrl(): string {
  return `${BLOB_STORAGE_BASE_URL}/${PACKAGE_NAME}/${pkgJson.version}/generator/dist/${PYGEN_WHEEL_FILENAME}`;
}

let browserPyodidePromise: Promise<PyodideInterface> | undefined;

/**
 * Boot the Pyodide runtime lazily, on the first browser emit.
 *
 * This must not happen when the module is imported: hosts like the TypeSpec playground import every
 * available emitter up front, and booting Pyodide downloads a full CPython WebAssembly runtime plus
 * its wheels (~10MB, ~290MB of resident memory). Doing that eagerly pushed the playground past the
 * per-tab memory budget on mobile browsers, which made the page fail to load.
 */
export function getBrowserPyodide(): Promise<PyodideInterface> | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (browserPyodidePromise === undefined) {
    browserPyodidePromise = setupPyodideCallBrowser().catch((error) => {
      // Clear the cached promise so a later emit can retry after a transient failure.
      browserPyodidePromise = undefined;
      throw error;
    });
  }
  return browserPyodidePromise;
}

async function setupPyodideCallBrowser(): Promise<PyodideInterface> {
  let pyodide: PyodideInterface | undefined;
  try {
    pyodide = await loadPyodide({
      indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
    });
    pyodide.FS.mkdirTree("/generator");
    await pyodide.loadPackage("micropip");
    await pyodide.pyimport("micropip").install(getBrowserPygenWheelUrl());
    return pyodide;
  } catch (publicError) {
    try {
      const assetsUrl = `${BLOB_STORAGE_BASE_URL}/${PACKAGE_NAME}/${pkgJson.version}/generator/dist`;
      pyodide ??= await loadPyodide({ indexURL: `${assetsUrl}/pyodide/` });
      pyodide.FS.mkdirTree("/generator");
      const response = await fetch(`${assetsUrl}/browser-wheels.json`);
      if (!response.ok) {
        throw new Error(`Failed to load browser Python wheels: ${response.status}`);
      }
      const wheels: unknown = await response.json();
      if (
        !Array.isArray(wheels) ||
        wheels.length < 3 ||
        !wheels.every(
          (name) =>
            typeof name === "string" &&
            /^[A-Za-z0-9_]+-[A-Za-z0-9_.-]+-(?:py3|py2\.py3)-none-any\.whl$/.test(name),
        ) ||
        !wheels[0].startsWith("packaging-") ||
        !wheels[1].startsWith("micropip-")
      ) {
        throw new Error("Invalid browser Python wheel manifest");
      }
      const urls = wheels.map((name) => `${assetsUrl}/browser-wheels/${name}`);
      await pyodide.loadPackage(urls.slice(0, 2));
      await pyodide
        .pyimport("micropip")
        .install.callKwargs([...urls.slice(2), getBrowserPygenWheelUrl()], { deps: false });
      return pyodide;
    } catch (hostedError) {
      throw new AggregateError(
        [publicError, hostedError],
        `Public Python runtime failed (${String(publicError)}); hosted fallback failed (${String(hostedError)})`,
      );
    }
  }
}
