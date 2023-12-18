// @ts-check
import { readFile } from "fs/promises";
import { dirname } from "path";
import { resolve } from "path/posix";
import { fileURLToPath } from "url";

export const templatesDir = resolve(dirname(fileURLToPath(import.meta.url)), "../../../templates");

const content = JSON.parse(await readFile(resolve(templatesDir, "scaffolding.json"), "utf-8"));

export const TypeSpecCoreTemplates = {
  baseUri: templatesDir,
  templates: content,
};
