import type { SystemHost } from "../core/types.js";
import { defaultInternalTemplateSource } from "./template-source/index.js";

export interface LoadedCoreTemplates {
  readonly baseUri: string;
  readonly templates: Record<string, any>;
}

let typeSpecCoreTemplates: LoadedCoreTemplates | undefined;
export async function getTypeSpecCoreTemplates(host: SystemHost): Promise<LoadedCoreTemplates> {
  if (typeSpecCoreTemplates === undefined) {
    const { templates, baseUri } = await defaultInternalTemplateSource(host).loadIndex();
    typeSpecCoreTemplates = { baseUri, templates };
  }
  return typeSpecCoreTemplates;
}
