import { type PackageJson, joinPaths } from "@typespec/compiler";
import { readFile } from "fs/promises";

export async function readPackageJson(libraryPath: string): Promise<PackageJson> {
  const buffer = await readFile(joinPaths(libraryPath, "package.json"));
  return JSON.parse(buffer.toString());
}
