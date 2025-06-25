import { cp } from "fs/promises";

await cp("node_modules/@typespec/compiler/templates", "../typespec-vscode/templates", {
  recursive: true,
});
