import { importLibrary } from "./core.js";
import { PlaygroundTspLibrary } from "./react/types.js";

/**
 * Filter emitters in given list of libraries
 * @param names List of libraries that could include emitters
 * @returns Names of all the emitters
 */
export async function resolveLibraries(names: string[]): Promise<PlaygroundTspLibrary[]> {
  return await Promise.all(
    names.map(async (x) => {
      const lib: any = await importLibrary(x);
      return { name: x, isEmitter: lib.$lib?.emitter, definition: lib.$lib };
    })
  );
}
