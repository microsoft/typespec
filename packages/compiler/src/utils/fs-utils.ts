import { NodeSystemHost } from "../core/node-system-host.js";
import { joinPaths, resolvePath } from "../core/path-utils.js";
import type { CompilerHost, SystemHost } from "../core/types.js";

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

/**
 * List all files in dir recursively
 * @returns relative path of the files from the given directory
 */
export async function listAllFilesInDir(host: SystemHost, dir: string): Promise<string[]> {
  const files: string[] = [];
  async function readDirs(currentDir: string) {
    const currentDirPath = resolvePath(dir, currentDir);
    const fileOrDirs = await host.readDir(currentDirPath);
    for (const file of fileOrDirs) {
      const fullPath = resolvePath(currentDirPath, file);
      const stat = await host.stat(fullPath);
      if (stat.isDirectory()) {
        await readDirs(resolvePath(currentDir, file));
      } else {
        files.push(resolvePath(currentDir, file));
      }
    }
  }

  await readDirs("");
  return files;
}

export async function existingFile(dir: string, fileName: string): Promise<string | undefined> {
  const candidate = joinPaths(dir, fileName);
  const stat = await NodeSystemHost.stat(candidate);
  return stat?.isFile() ? candidate : undefined;
}
