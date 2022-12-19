import { access, readFile, realpath, stat } from "fs/promises";
import { join, resolve } from "path";
import { fileURLToPath, pathToFileURL } from "url";
import { resolveModule, ResolveModuleHost } from "../core/module-resolver.js";

/**
 * Run script given by relative path from @cadl-lang/compiler package root.
 * Prefer local install resolved from cwd over current package.
 *
 * Prevents loading two conflicting copies of Cadl modules from global and
 * local package locations.
 */
export async function runScript(relativePath: string, backupPath: string): Promise<void> {
  const packageRoot = await resolvePackageRoot();

  if (packageRoot) {
    let script = join(packageRoot, relativePath);
    if (!(await checkFileExists(script)) && backupPath) {
      script = join(packageRoot, backupPath);
    }
    const scriptUrl = pathToFileURL(script).toString();
    await import(scriptUrl);
  } else {
    throw new Error(
      "Couldn't resolve Cadl compiler root. This is unexpected. Please file an issue at https://github.com/Microsoft/cadl."
    );
  }
}

function checkFileExists(file: string) {
  return access(file)
    .then(() => true)
    .catch(() => false);
}

async function resolvePackageRoot(): Promise<string> {
  if (process.env.CADL_SKIP_COMPILER_RESOLVE === "1") {
    return await getThisPackageRoot();
  }

  try {
    const host: ResolveModuleHost = {
      realpath,
      readFile: async (path: string) => await readFile(path, "utf-8"),
      stat,
    };
    const resolved = await resolveModule(host, "@cadl-lang/compiler", {
      baseDir: process.cwd(),
    });
    if (resolved.type !== "module") {
      throw new Error(
        `Error resolving "@cadl-lang/compiler", expected to find a node module but found a file: "${resolved.path}".`
      );
    }
    return resolved.path;
  } catch (err: any) {
    if (err.code === "MODULE_NOT_FOUND") {
      // Resolution from cwd failed: use current package.
      return await getThisPackageRoot();
    } else {
      throw err;
    }
  }
}

async function getThisPackageRoot() {
  return resolve(await realpath(fileURLToPath(import.meta.url)), "../../..");
}
