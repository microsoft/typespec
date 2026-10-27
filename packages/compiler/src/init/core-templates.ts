import type { SystemHost } from "../core/types.js";
import { defaultInternalTemplateSource } from "./template-source/index.js";

/** Built-in initialization templates advertised by the compiler to editor clients. */
export interface LoadedCoreTemplates {
  /** Base location identifying the source of the built-in template index. */
  readonly baseUri: string;
  /** Template definitions keyed by their selection identifiers. */
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
