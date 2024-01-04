// @ts-check
/**
 * Script to pack all workspace packages
 */

import { findWorkspacePackagesNoCheck } from "@pnpm/find-workspace-packages";
import { runOrExit } from "../../packages/internal-build-utils/dist/src/common.js";
import { repoRoot } from "./helpers.js";

const projects = await findWorkspacePackagesNoCheck(repoRoot);

for (const project of projects) {
  runOrExit("pnpm", ["pack", `--pack-destination`, `${repoRoot}/temp/artifacts`], {
    cwd: project.dir,
  });
}
