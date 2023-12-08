import { readFile } from "fs/promises";
import { dirname } from "path";
import { resolve } from "path/posix";
import { fileURLToPath } from "url";

export const packageRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const content: Record<string, any> = JSON.parse(
  await readFile(resolve(packageRoot, "scaffolding.json"), "utf-8")
);

export const TypeSpecCoreTemplates = {
  baseUri: packageRoot,
  templates: content,
};
