import { readFile } from "fs/promises";
import { dirname } from "path";
import { fileURLToPath } from "url";
import { resolvePath } from "../core/path-utils.js";

export const templatesDir = resolvePath(
  dirname(fileURLToPath(import.meta.url)),
  "../../../templates"
);

const content = JSON.parse(await readFile(resolvePath(templatesDir, "scaffolding.json"), "utf-8"));

export const TypeSpecCoreTemplates = {
  baseUri: templatesDir,
  templates: content,
};
