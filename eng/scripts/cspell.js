// @ts-check
import { resolve } from "path";
import { repoRoot } from "./helpers.js";
import { run } from "../../packages/internal-build-utils/dist/src/index.js";
export const cspell = resolve(repoRoot, "packages/internal-build-utils/node_modules/.bin/cspell");

await run(
  cspell,
  ["**/*.md", "**/*.ts", "**/*.js", "**/changelog.json", "common/changes/**/*.json"],
  {
    cwd: repoRoot,
  }
);
