import { Exports } from "../../types/package-json.js";
import { resolvePackageImportsExports } from "../esm/resolve-package-imports-exports.js";
import { resolvePackageTarget } from "../esm/resolve-package-target.js";
import { Context, InvalidModuleSpecifierError } from "./utils.js";

/** Impleementation of PACKAGE_EXPORTS_RESOLVE https://github.com/nodejs/node/blob/main/doc/api/esm.md */
export async function resolvePackageExports(
  context: Context,
  subpath: string,
  exports: Exports,
): Promise<string | null | undefined> {
  if (exports === null) return undefined;

  if (subpath === ".") {
    let mainExport: Exports | undefined;
    if (typeof exports === "string" || Array.isArray(exports) || isConditions(exports)) {
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

/** Conditions is an export object where all keys are conditions(not a path starting with .). E.g. import, default, types, etc. */
function isConditions(item: Record<string, Exports>) {
  return typeof item === "object" && Object.keys(item).every((k) => !k.startsWith("."));
}
