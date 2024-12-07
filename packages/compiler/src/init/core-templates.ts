import { CompilerPackageRoot } from "../core/node-host.js";
import { resolvePath } from "../core/path-utils.js";
import { CompilerHost } from "../index.js";

export const templatesDir = resolvePath(CompilerPackageRoot, "templates");
export interface LoadedCoreTemplates {
  readonly baseUri: string;
  readonly templates: Record<string, any>;
}

let typeSpecCoreTemplates: LoadedCoreTemplates | undefined;
export async function getTypeSpecCoreTemplates(host: CompilerHost): Promise<LoadedCoreTemplates> {
  if (typeSpecCoreTemplates === undefined) {
    const file = await host.readFile(resolvePath(templatesDir, "scaffolding.json"));
    const content = JSON.parse(file.text);
    typeSpecCoreTemplates = {
      baseUri: templatesDir,
      templates: content,
    };
  }
  return typeSpecCoreTemplates;
}
