// @ts-check
import { resolve } from "path";
import { runOrExit, xplatCmd } from "../../packages/internal-build-utils/dist/src/index.js";
import { repoRoot } from "./helpers.js";
export const cspell = xplatCmd(
  resolve(repoRoot, "packages/internal-build-utils/node_modules/.bin/cspell")
);

await runOrExit(
  cspell,
  [
    "--no-progress",
    "**/*.md",
    "**/*.ts",
    "**/*.tsx",
    "**/*.js",
    "**/changelog.json",
    "common/changes/**/*.json",
  ],
  {
    cwd: repoRoot,
  }
);
