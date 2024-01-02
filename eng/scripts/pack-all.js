// @ts-check
/**
 * Script to pack all workspace packages
 */

import { findWorkspacePackagesNoCheck } from "@pnpm/find-workspace-packages";
import { repoRoot, run } from "./helpers.js";

const projects = await findWorkspacePackagesNoCheck(repoRoot);

for (const project of projects) {
  run("pnpm", ["pack", `--pack-destination`, `${repoRoot}/temp/artifacts`], { cwd: project.dir });
}
