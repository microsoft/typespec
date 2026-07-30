// Plain JavaScript bootstrap for the npm `prepare` lifecycle script.
// This file must stay as plain JavaScript because it may run from within
// node_modules (when the package is installed as a dependency), where
// Node.js refuses to strip TypeScript types.
//
// When installed from npm/tgz the compiled dist/scripts/setup/prepare.js is
// used.  When running in the repository itself (dev context) the TypeScript
// source is loaded directly via Node.js native type stripping.
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compiledPath = join(__dirname, "../../../dist/scripts/setup/prepare.js");

try {
  if (existsSync(compiledPath)) {
    // Installed from npm package: use pre-compiled JavaScript.
    // Use pathToFileURL so Windows absolute paths (D:\...) are valid ESM URLs.
    await import(pathToFileURL(compiledPath).href);
  } else {
    // Development context: TypeScript source works via native type stripping.
    await import("./prepare.ts");
  }
} catch (err) {
  if (err?.code === "ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING") {
    // Running from node_modules without pre-compiled JS — this shouldn't
    // happen for a properly built package, but fail gracefully rather than
    // blocking the install.
    console.log("Python environment prepare skipped: run 'npm run build' first."); // eslint-disable-line no-console
  } else {
    throw err;
  }
}
