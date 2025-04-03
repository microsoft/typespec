import type { SystemHost } from "../core/types.js";

export interface LoadedCoreTemplates {
  readonly baseUri: string;
  readonly templates: Record<string, any>;
}

export async function getTypeSpecCoreTemplates(host: SystemHost): Promise<LoadedCoreTemplates> {}
