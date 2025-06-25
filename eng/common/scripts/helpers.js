// @ts-check
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

export const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
export const prettier = resolve(repoRoot, "packages/compiler/node_modules/.bin/prettier");
export const tsc = resolve(repoRoot, "packages/compiler/node_modules/.bin/tsc");
