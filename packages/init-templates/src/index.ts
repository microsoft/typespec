import { readFile } from "fs/promises";
import { dirname } from "path";
import { resolve } from "path/posix";
import { fileURLToPath } from "url";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../..");

const content: Record<string, any> = JSON.parse(
  await readFile(resolve(packageRoot, "scaffolding.json"), "utf-8")
);

export const builtInTemplates: Record<string, any> = Object.fromEntries(
  Object.entries(content).map(([k, v]) => {
    return [k, { ...v, files: v.files?.map(expandFile) ?? [] }];
  })
);

function expandFile(file: any): any {
  return { ...file, path: resolve(packageRoot, file.path) };
}
