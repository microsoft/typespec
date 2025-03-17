import { joinPaths } from "../core/path-utils.js";
import type { CompilerHost } from "../core/types.js";

export async function mkTempDir(host: CompilerHost, base: string, prefix: string): Promise<string> {
  const rnd = Math.random() * 0x100000000;
  const hex = rnd.toString(16).padStart(8, `0`);
  const path = joinPaths(base, ".temp", `${prefix}-${process.pid}-${hex}`);

  try {
    await host.mkdirp(path);
    return path;
  } catch (error) {
    if ((error as any).code === `EACCES`) {
      throw new Error(
        `Cannot create temporary folder at ${path}. Permission denied. Please check your permissions.`,
      );
    } else {
      throw error;
    }
  }
}
