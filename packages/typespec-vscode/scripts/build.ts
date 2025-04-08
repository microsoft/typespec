import { context } from "esbuild";
import { cp } from "fs/promises";

// Copy swagger-ui files to dist
await cp("node_modules/swagger-ui-dist/swagger-ui.css", "dist/swagger-ui.css");
await cp("node_modules/swagger-ui-dist/swagger-ui-bundle.js", "dist/swagger-ui-bundle.js");
await cp(
  "node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js",
  "dist/swagger-ui-standalone-preset.js",
);

// Build the extension
const nodeContext = await context({
  entryPoints: ["src/extension.ts"],
  bundle: true,
  outfile: "dist/src/extension.cjs",
  platform: "node",
  mainFields: ["module", "main"], // app insights web https://www.npmjs.com/package/@microsoft/applicationinsights-web-basic uses module instead of exports...
  target: "node22",
  format: "cjs",
  sourcemap: true,
  external: ["vscode"],
});

// Build the web extension
const webContext = await context({
  entryPoints: ["src/web/extension.ts"],
  bundle: true,
  outfile: "dist/src/web/extension.js",
  mainFields: ["module", "main"], // app insights web https://www.npmjs.com/package/@microsoft/applicationinsights-web-basic uses module instead of exports...
  platform: "browser",
  format: "cjs",
  sourcemap: true,
  external: ["vscode"],
});

// Build the web test suite
const webTestContext = await context({
  entryPoints: ["test/web/suite.ts"],
  bundle: true,
  outfile: "dist/test/web/suite.js",
  mainFields: ["module", "main"], // app insights web https://www.npmjs.com/package/@microsoft/applicationinsights-web-basic uses module instead of exports...
  platform: "browser",
  format: "cjs",
  external: ["vscode"],
});

if (process.argv.includes("--watch")) {
  console.log("Watching for changes...");
  // Watch the extension
  await Promise.all([nodeContext.watch(), webContext.watch(), webTestContext.watch()]);
} else {
  console.log("Building...");

  // Watch the extension
  await nodeContext.rebuild();
  await webContext.rebuild();
  await webTestContext.rebuild();

  nodeContext.dispose();
  webContext.dispose();
  webTestContext.dispose();
}
