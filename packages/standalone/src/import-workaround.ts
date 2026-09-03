import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import { serveFromMemory } from "./module-loader.js";

// TEMPORARY WORKAROUND (nodejs/node#62726).
//
// A single-executable's *own* `import()`/`require()` can only resolve builtin modules, so it cannot
// import an external file or a hooks-served module directly (throws `ERR_UNKNOWN_BUILTIN_MODULE` on
// Node >= 25.5). We escape via a tiny CommonJS "bridge": `createRequire(process.execPath)` returns a
// real `require` that loads the bridge, and because the bridge is then an ordinary module its
// `import()` runs through the standard loader (honors `registerHooks`, supports top-level `await`).
//
// When #62726 is fixed, delete this file and replace calls to `importExternal(specifier)` with a
// plain `import(specifier)`.

const BRIDGE_SPECIFIER = "typespec:import-bridge";
const BRIDGE_URL = pathToFileURL(
  join(dirname(process.execPath), "__typespec_bundled__", "import-bridge.cjs"),
).href;

let bridge: ((specifier: string) => Promise<unknown>) | undefined;

/**
 * Import a module that is not baked into this executable: an external file on disk (passed as a
 * `file://` URL) or a module registered via `serveFromMemory`.
 */
export async function importExternal(specifier: string): Promise<unknown> {
  if (bridge === undefined) {
    serveFromMemory(BRIDGE_SPECIFIER, BRIDGE_URL, {
      format: "commonjs",
      source: "module.exports = (specifier) => import(specifier);",
    });
    bridge = createRequire(process.execPath)(BRIDGE_SPECIFIER) as (s: string) => Promise<unknown>;
  }
  return bridge(specifier);
}
