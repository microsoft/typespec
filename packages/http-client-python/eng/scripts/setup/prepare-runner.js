// Plain JavaScript bootstrap for the npm `prepare` lifecycle script.
// This file must stay as plain JavaScript because it may run from within
// node_modules (when the package is installed as a dependency), where
// Node.js refuses to strip TypeScript types.
//
// When installed from npm/tgz the compiled dist/scripts/setup/prepare.js is
// used.  When running in the repository itself (dev context) the TypeScript
// source is loaded directly via Node.js native type stripping.
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const compiledPath = join(__dirname, "../../../dist/scripts/setup/prepare.js");

try {
  await import("./prepare.ts");
} catch (err) {
  if (err?.code !== "ERR_UNSUPPORTED_NODE_MODULES_TYPE_STRIPPING") {
    throw err;
  }
  if (existsSync(compiledPath)) {
    await import(pathToFileURL(compiledPath).href);
  } else {
    console.log("Python environment prepare skipped: run 'npm run build' first."); // eslint-disable-line no-console
  }
}
