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

runWatch("dist/server", regenerate, {
  // This filter doesn't do as much as one might hope because tsc writes out all
  // the files on recompilation. So tmlanguage.js changes when other .ts files
  // in cadl-vscode change but tmlanguage.ts has not changed. We could check the
  // tmlanguage.ts timestamp to fix it, but it didn't seem worth the complexity.
  // We can't just watch tmlanguage.ts because we need to wait for tsc to
  // compile it.
  filter: (file) => file === scriptPath,
});
