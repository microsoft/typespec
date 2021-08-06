import path from "path";
import resolveModule from "resolve";
import url from "url";

/**
 * Run script given by relative path from @azure-tools/cadl package root.
 * Prefer local install resolved from cwd over current package.
 *
 * Prevents loading two conflicting copies of Cadl modules from global and
 * local package locations.
 */
export function runScript(relativePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    resolveModule(
      "@azure-tools/cadl",
      {
        basedir: process.cwd(),
        preserveSymlinks: false,
      },
      (err, resolved) => {
        let packageRoot: string;
        if (err) {
          if ((err as any).code === "MODULE_NOT_FOUND") {
            // Resolution from cwd failed: use current package.
            packageRoot = path.resolve(url.fileURLToPath(import.meta.url), "../../..");
          } else {
            reject(err);
            return;
          }
        } else if (!resolved) {
          reject(new Error("BUG: Module resolution succeeded, but didn't return a value."));
          return;
        } else {
          // Resolution succeeded to dist/compiler/index.js in local package.
          packageRoot = path.resolve(resolved, "../../..");
        }
        const script = path.join(packageRoot, relativePath);
        const scriptUrl = url.pathToFileURL(script).toString();
        resolve(import(scriptUrl));
      }
    );
  });
}
