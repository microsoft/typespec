import { copyFile } from "fs/promises";

await copyFile(
  "node_modules/swagger-ui-dist/swagger-ui.css",
  "../typespec-vscode/dist/swagger-ui.css",
);
await copyFile(
  "node_modules/swagger-ui-dist/swagger-ui-bundle.js",
  "../typespec-vscode/dist/swagger-ui-bundle.js",
);
await copyFile(
  "node_modules/swagger-ui-dist/swagger-ui-standalone-preset.js",
  "../typespec-vscode/dist/swagger-ui-standalone-preset.js",
);
