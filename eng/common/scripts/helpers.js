// @ts-check
import { findWorkspacePackagesNoCheck } from "@pnpm/find-workspace-packages";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const prettier = resolve(repoRoot, "packages/compiler/node_modules/.bin/prettier");
export const tsc = resolve(repoRoot, "packages/compiler/node_modules/.bin/tsc");

/** @returns {Promise<import("@pnpm/find-workspace-packages").Project[]>*/
export function listPackages() {
  return findWorkspacePackagesNoCheck(repoRoot);
}
