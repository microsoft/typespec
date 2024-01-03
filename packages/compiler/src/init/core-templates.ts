import { readFile } from "fs/promises";
import { resolvePath } from "../core/path-utils.js";
import { CompilerPackageRoot } from "../core/node-host.js";

export const templatesDir = resolvePath(CompilerPackageRoot, "templates");

const content = JSON.parse(await readFile(resolvePath(templatesDir, "scaffolding.json"), "utf-8"));

export const TypeSpecCoreTemplates = {
  baseUri: templatesDir,
  templates: content,
};
