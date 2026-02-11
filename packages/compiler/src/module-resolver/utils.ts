import { getDirectoryPath } from "../core/path-utils.js";
import type { NodePackage, ResolveModuleHost } from "./types.js";

export interface NodeModuleSpecifier {
  readonly packageName: string;
  readonly subPath: string;
}
// returns the imported package name for bare module imports
export function parseNodeModuleSpecifier(id: string): NodeModuleSpecifier | null {
  if (id.startsWith(".") || id.startsWith("/")) {
    return null;
  }

  const split = id.split("/");

  // @my-scope/my-package/foo.js -> @my-scope/my-package
  // @my-scope/my-package -> @my-scope/my-package
  if (split[0][0] === "@") {
    return { packageName: `${split[0]}/${split[1]}`, subPath: split.slice(2).join("/") };
  }

  // my-package/foo.js -> my-package
  // my-package -> my-package
  return { packageName: split[0], subPath: split.slice(1).join("/") };
}

export async function readPackage(host: ResolveModuleHost, pkgfile: string): Promise<NodePackage> {
  const content = await host.readFile(pkgfile);
  return {
    ...JSON.parse(content),
    dir: getDirectoryPath(pkgfile),
    file: {
      path: pkgfile,
      text: content,
    },
  };
}

export async function isFile(host: ResolveModuleHost, path: string) {
  try {
    const stats = await host.stat(path);
    return stats.isFile();
  } catch (e: any) {
    if (e.code === "ENOENT" || e.code === "ENOTDIR") {
      return false;
    }
    throw e;
  }
}
export function pathToFileURL(path: string): string {
  return `file://${path}`;
}

export function fileURLToPath(url: string) {
  if (!url.startsWith("file://")) throw new Error("Cannot convert non file: URL to path");

  const pathname = url.slice("file://".length);

  for (let n = 0; n < pathname.length; n++) {
    if (pathname[n] === "%") {
      const third = pathname.codePointAt(n + 2)! | 0x20;

      if (pathname[n + 1] === "2" && third === 102) {
        throw new Error("Invalid url to path: must not include encoded / characters");
      }
    }
  }

  return decodeURIComponent(pathname);
}

/**
 * Returns a list of all the parent directory and the given one.
 */
export function listDirHierarchy(baseDir: string): string[] {
  const paths = [baseDir];
  let current = getDirectoryPath(baseDir);
  while (current !== paths[paths.length - 1]) {
    paths.push(current);
    current = getDirectoryPath(current);
  }

  return paths;
}
