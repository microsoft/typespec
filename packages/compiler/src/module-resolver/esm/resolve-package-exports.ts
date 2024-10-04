import { Exports } from "../../types/package-json.js";
import { resolvePackageImportsExports } from "../esm/resolve-package-imports-exports.js";
import { resolvePackageTarget } from "../esm/resolve-package-target.js";
import { Context, InvalidModuleSpecifierError } from "./utils.js";

/** Impleementation of PACKAGE_EXPORTS_RESOLVE https://github.com/nodejs/node/blob/main/doc/api/esm.md */
export async function resolvePackageExports(context: Context, subpath: string, exports: Exports) {
  if (exports === null) return undefined;

  if (subpath === ".") {
    let mainExport;
    if (typeof exports === "string" || Array.isArray(exports) || "." in exports) {
      mainExport = exports;
    } else if (exports["."]) {
      mainExport = exports["."];
    }

    if (mainExport) {
      const resolved = resolvePackageTarget(context, {
        target: mainExport,
        isImports: false,
      });

      // If resolved is not null or undefined, return resolved.
      if (resolved) {
        return resolved;
      }
    }
  } else {
    // Let resolved be the result of PACKAGE_IMPORTS_EXPORTS_RESOLVE
    const resolvedMatch = await resolvePackageImportsExports(context, {
      matchKey: subpath,
      matchObj: exports as any,
      isImports: false,
    });

    // If resolved is not null or undefined, return resolved.
    if (resolvedMatch) {
      return resolvedMatch;
    }
  }

  // 4. Throw a Package Path Not Exported error.
  throw new InvalidModuleSpecifierError(context);
}
