import { build } from "esbuild";
import { cp } from "fs/promises";

// Copy swagger-ui files to dist
await cp("node_modules/swagger-ui-dist/swagger-ui.css", "dist/swagger-ui.css");
await cp("node_modules/swagger-ui-dist/swagger-ui-bundle.js", "dist/swagger-ui-bundle.js");
await cp(
  "node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js",
  "dist/swagger-ui-standalone-preset.js",
);

// Build the extension
await build({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/src/extension.cjs",
  platform: "node",
  target: "node22",
  format: "cjs",
  external: ["vscode"],
});

// Build the web extension
await build({
  entryPoints: ["src/web/extension.ts"],
  bundle: true,
  outfile: "dist/src/web/extension.js",
  platform: "browser",
  format: "cjs",
  external: ["vscode"],
});

// Build the web test suite
await build({
  entryPoints: ["test/web/suite.ts"],
  bundle: true,
  outfile: "dist/test/web/suite.js",
  platform: "browser",
  format: "cjs",
  external: ["vscode"],
});
