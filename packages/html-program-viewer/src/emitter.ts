import { Program, resolvePath } from "@cadl-lang/compiler";
import { readFile } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { renderProgram } from "./ui.js";

export async function $onEmit(program: Program) {
  const html = renderProgram(program);
  const htmlPath = resolvePath(program.compilerOptions.outputPath!, "cadl-program.html");
  const cssPath = resolvePath(program.compilerOptions.outputPath!, "style.css");
  await program.host.writeFile(
    htmlPath,
    `<!DOCTYPE html><html lang="en"><link rel="stylesheet" href="style.css"><body>${html}</body></html>`
  );
  const cssFile = resolve(dirname(fileURLToPath(import.meta.url)), "../../src/style.css");
  await program.host.writeFile(cssPath, await (await readFile(cssFile)).toString());
}
