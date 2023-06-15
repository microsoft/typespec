import { importLibrary } from "./core.js";

/**
 * Filter emitters in given list of libraries
 * @param libraries List of libraries that could include emitters
 * @returns Names of all the emitters
 */
export async function filterEmitters(libraries: string[]): Promise<string[]> {
  const loaded = await Promise.all(libraries.map(async (x) => [x, await importLibrary(x)]));
  return loaded.filter(([, x]) => (x as any).$lib?.emitter).map((x: any) => x[0]);
}
