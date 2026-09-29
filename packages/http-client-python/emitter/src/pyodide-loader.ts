// Node-side re-export of `loadPyodide`. The browser swap (`pyodide-loader.browser.ts`)
// loads pyodide from a CDN or published script asset instead, so that the browser bundle
// never statically imports the npm `pyodide` package (whose `pyodide.mjs`
// contains static `import "node:*"` calls that break esbuild's browser target).
export { loadPyodide } from "pyodide";
export type { PyodideInterface } from "pyodide";
