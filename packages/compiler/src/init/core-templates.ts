import { readFile } from "fs/promises";
import { CompilerPackageRoot } from "../core/node-host.js";
import { resolvePath } from "../core/path-utils.js";

export const templatesDir = resolvePath(CompilerPackageRoot, "templates");

const content = JSON.parse(await readFile(resolvePath(templatesDir, "scaffolding.json"), "utf-8"));

export const TypeSpecCoreTemplates = {
  baseUri: templatesDir,
  templates: content,
};
