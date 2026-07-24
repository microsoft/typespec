import { copyFile } from "fs/promises";

await copyFile(
  "node_modules/@typespec/compiler/dist/typespec.tmLanguage",
  "../typespec-vscode/dist/typespec.tmLanguage",
);
