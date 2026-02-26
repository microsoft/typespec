import type { ResolveModuleHost } from "../module-resolver/index.js";
import type { SystemHost } from "./types.js";

/** Create a {@link ResolveModuleHost} from a {@link SystemHost}. */
export function createResolveModuleHost(host: SystemHost): ResolveModuleHost {
  return {
    realpath: host.realpath,
    stat: host.stat,
    readFile: async (path) => {
      const file = await host.readFile(path);
      return file.text;
    },
  };
}
