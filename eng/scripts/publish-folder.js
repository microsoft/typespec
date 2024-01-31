// @ts-check
/**
 * Script to pack all workspace packages
 */

import { findWorkspacePackagesNoCheck } from "@pnpm/find-workspace-packages";
import { sortPackages } from "@pnpm/sort-packages";
import { createPkgGraph } from "@pnpm/workspace.pkgs-graph";
import { execFileSync } from "child_process";
import { readdirSync } from "fs";
import { join } from "path";
import { repoRoot } from "./helpers.js";
const folderToPublish = process.argv[2];
const tag = process.argv[3];
console.log("Will publish", folderToPublish, "at tag", tag);
const files = readdirSync(folderToPublish);
const projects = await findWorkspacePackagesNoCheck(repoRoot);
/** @type {any} */
const { graph } = createPkgGraph(projects);
for (const chunks of sortPackages(graph)) {
  for (const pkgName of chunks) {
    console.log("Will try to publish", pkgName);
    const normalized = pkgName.replace("@", "").replace("/", "-");
    const tgz = files.find((f) => f.startsWith(normalized));
    if (tgz === undefined) {
      throw new Error("Couldn't find tgz for package " + pkgName);
    }
    console.log("Publishing ", tgz);
    execFileSync("pnpm", [
      "publish",
      join(folderToPublish, tgz),
      "--access",
      "public",
      "--no-git-checks",
      "--tag",
      tag,
    ]);
  }
}
