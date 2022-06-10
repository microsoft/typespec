import { copyFile } from "fs/promises";

await copyFile(
  "node_modules/@cadl-lang/compiler/dist/cadl.tmLanguage",
  "../cadl-vscode/dist/cadl.tmLanguage"
);
