import { joinPaths } from "@typespec/compiler";
import { writeFile } from "fs/promises";
import { createTypekitDocs } from "./components/typekits-file.js";
import { createTypekitCollection } from "./typekit-model.js";
import { readPackageJson } from "./utils/misc.js";

export type {
  TsFunctionParameter,
  TypekitCollection,
  TypekitEntryDoc,
  TypekitFunctionDoc,
  TypekitNamespace,
} from "./typekit-model.js";

export async function writeTypekitDocs(libraryPath: string, outputDir: string): Promise<void> {
  const pkgJson = await readPackageJson(libraryPath);

  const typekits = await createTypekitCollection(libraryPath, pkgJson);
  if (!typekits) {
    return;
  }
  const output = await createTypekitDocs(typekits);
  for (const [file, content] of Object.entries(output)) {
    await writeFile(joinPaths(outputDir, file), content);
  }
}
