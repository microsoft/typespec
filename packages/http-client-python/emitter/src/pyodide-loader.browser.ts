// Browser stub for `pyodide-loader.ts`. Loads pyodide via a `<script>` tag
// from the CDN at runtime so that the npm `pyodide` package (which contains
// static Node-builtin imports) never enters the browser bundle.

// Pull the type-only import from pyodide so type-checking still works; this
// declaration is fully erased at bundle time.
import type { PyodideInterface as _PyodideInterface } from "pyodide";

export type PyodideInterface = _PyodideInterface;

interface LoadPyodideOptions {
  indexURL: string;
  [key: string]: any;
}

declare global {
  var loadPyodide: ((options: LoadPyodideOptions) => Promise<PyodideInterface>) | undefined;
}

let scriptLoadPromise: Promise<void> | null = null;

function loadPyodideScript(indexURL: string): Promise<void> {
  if (scriptLoadPromise) return scriptLoadPromise;
  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    if (typeof globalThis.loadPyodide === "function") {
      resolve();
      return;
    }
    const script = document.createElement("script");
    // indexURL is expected to end with a trailing slash, matching pyodide's contract.
    script.src = `${indexURL}pyodide.js`;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`Failed to load pyodide from ${script.src}`));
    document.head.appendChild(script);
  });
  return scriptLoadPromise;
}

export async function loadPyodide(options: LoadPyodideOptions): Promise<PyodideInterface> {
  await loadPyodideScript(options.indexURL);
  if (typeof globalThis.loadPyodide !== "function") {
    throw new Error("pyodide script loaded but globalThis.loadPyodide is not defined");
  }
  return globalThis.loadPyodide(options);
}
