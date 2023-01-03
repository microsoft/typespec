import { runWatch } from "@cadl-lang/internal-build-utils";
import { copyFile } from "fs/promises";
import mkdirp from "mkdirp";
import { resolve } from "path";
import { pathToFileURL } from "url";

let count = 0;
const scriptPath = resolve("dist/server/tmlanguage.js");

async function regenerate() {
  const script = await import(`${pathToFileURL(scriptPath)}?q=${count++}`);
  await script.main();
  await mkdirp("../cadl-vscode/dist");
  await copyFile("dist/cadl.tmLanguage", "../cadl-vscode/dist/cadl.tmLanguage");
}

runWatch("dist/server/tmlanguage.js", regenerate, {});
