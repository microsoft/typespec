import { build } from "esbuild";
// Build the extension
await build({
  entryPoints: ["src/index.mjs"],
  bundle: true,
  outfile: "dist/index.js",
  platform: "node",
  target: "node22",
  format: "esm",
  sourcemap: true,
  external: ["prettier", "fs/promises", "ajv", "yaml"],
});
