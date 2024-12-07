import { readFile } from "fs/promises";
import { CompilerPackageRoot } from "../core/node-host.js";
import { resolvePath } from "../core/path-utils.js";

export const templatesDir = resolvePath(CompilerPackageRoot, "templates");

const content = JSON.parse(await readFile(resolvePath(templatesDir, "scaffolding.json"), "utf-8"));

export interface LoadedCoreTemplates {
  readonly baseUri: string;
  readonly templates: Record<string, any>;
}
export const TypeSpecCoreTemplates: LoadedCoreTemplates = {
  baseUri: templatesDir,
  templates: content,
};
