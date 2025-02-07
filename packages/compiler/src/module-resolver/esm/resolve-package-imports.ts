import { Imports } from "../../types/package-json.js";
import { resolvePackageImportsExports } from "./resolve-package-imports-exports.js";
import {
  EsmResolutionContext,
  InvalidModuleSpecifierError,
  PackageImportNotDefinedError,
} from "./utils.js";

/** Implementation of PACKAGE_IMPORTS_RESOLVE https://github.com/nodejs/node/blob/main/doc/api/esm.md */
export async function resolvePackageImports(
  context: EsmResolutionContext,
  imports: Imports,
): Promise<string | null | undefined> {
  // If specifier is exactly equal to "#" or starts with "#/", then
  if (context.specifier === "#" || context.specifier.startsWith("#/")) {
    // Throw an Invalid Module Specifier error.
    throw new InvalidModuleSpecifierError(context);
  }

  // If packageJson.imports is a non-null Object, then
  if (imports !== null) {
    // Let resolved be the result of PACKAGE_IMPORTS_EXPORTS_RESOLVE.
    const resolvedMatch = await resolvePackageImportsExports(context, {
      matchKey: context.specifier,
      matchObj: imports,
      isImports: true,
    });

    // If resolved is not null or undefined, return resolved.
    if (resolvedMatch) {
      return resolvedMatch;
    }
  }

  // Throw a Package Import Not Defined error.
  throw new PackageImportNotDefinedError(context);
}
