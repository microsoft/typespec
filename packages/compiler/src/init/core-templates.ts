import type { CompilerHost } from "../core/types.js";
import { FileSystemTemplateSource } from "./template-source/index.js";

export interface LoadedCoreTemplates {
  readonly baseUri: string;
  readonly templates: Record<string, any>;
}

let typeSpecCoreTemplates: LoadedCoreTemplates | undefined;
export async function getTypeSpecCoreTemplates(host: CompilerHost): Promise<LoadedCoreTemplates> {
  if (typeSpecCoreTemplates === undefined) {
    const { templates, baseUri } = await new FileSystemTemplateSource(host).loadIndex();
    typeSpecCoreTemplates = { baseUri, templates };
  }
  return typeSpecCoreTemplates;
}
