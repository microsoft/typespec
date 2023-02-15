import { runWatch } from "@typespec/internal-build-utils";
import { copyFile } from "fs/promises";
import mkdirp from "mkdirp";
import { resolve } from "path";
import { pathToFileURL } from "url";

let count = 0;
const scriptPath = resolve("dist/server/tmlanguage.js");

async function regenerate() {
  const script = await import(`${pathToFileURL(scriptPath)}?q=${count++}`);
  await script.main();
  await mkdirp("../typespec-vscode/dist");
  await copyFile("dist/typespec.tmLanguage", "../typespec-vscode/dist/typespec.tmLanguage");
}

runWatch("dist/server/tmlanguage.js", regenerate, {});
