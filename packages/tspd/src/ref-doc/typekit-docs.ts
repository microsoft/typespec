import { joinPaths } from "@typespec/compiler";
import { writeFile } from "fs/promises";
import { createTypekitDocs } from "./components/typekits-file.js";
import { createTypekitCollection } from "./typekit-model.js";
import { readPackageJson } from "./utils/misc.js";

export type {
  TsFunctionParameter,
  TypekitCollection,
  TypekitFunctionDoc,
  TypekitNamespace,
} from "./typekit-model.js";

/**
 * Writes Markdown pages for interfaces tagged `@typekit` in the first matching typekit export.
 * Uses API Extractor on the library's built declarations and writes its intermediate API model
 * under the library's `temp` directory. Requires a package `exports` map; when that map has no
 * typekit export, returns without writing pages.
 * @param outputDir Existing destination directory; matching generated pages are overwritten.
 */
export async function writeTypekitDocs(libraryPath: string, outputDir: string): Promise<void> {
  const pkgJson = await readPackageJson(libraryPath);
  const typekits = await createTypekitCollection(libraryPath, pkgJson);
  if (!typekits) return;

  const output = await createTypekitDocs(typekits);
  for (const [file, content] of Object.entries(output)) {
    await writeFile(joinPaths(outputDir, file), content);
  }
}
