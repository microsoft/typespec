import { realpath } from "fs/promises";
import path from "path";
import url from "url";
import { resolveModule } from "../core/module-resolver.js";
import { NodeHost } from "../core/util.js";
/**
 * Run script given by relative path from @cadl-lang/compiler package root.
 * Prefer local install resolved from cwd over current package.
 *
 * Prevents loading two conflicting copies of Cadl modules from global and
 * local package locations.
 */
export async function runScript(relativePath: string): Promise<void> {
  let packageRoot;
  try {
    const resolved = await resolveModule(NodeHost, "@cadl-lang/compiler", {
      baseDir: process.cwd(),
    });
    packageRoot = path.resolve(resolved, "../../..");
  } catch (err: any) {
    if (err.code === "MODULE_NOT_FOUND") {
      // Resolution from cwd failed: use current package.
      packageRoot = path.resolve(await realpath(url.fileURLToPath(import.meta.url)), "../../..");
    } else {
      throw err;
    }
  }

  if (packageRoot) {
    const script = path.join(packageRoot, relativePath);
    const scriptUrl = url.pathToFileURL(script).toString();
    import(scriptUrl);
  } else {
    throw new Error(
      "Couldn't resolve Cadl compiler root. This is unexpected. Please file an issue at https://github.com/Microsoft/cadl."
    );
  }
}
