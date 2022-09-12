// @ts-check
import { resolve } from "path";
import { run, xplatCmd } from "../../packages/internal-build-utils/dist/src/index.js";
import { repoRoot } from "./helpers.js";
export const cspell = xplatCmd(
  resolve(repoRoot, "packages/internal-build-utils/node_modules/.bin/cspell")
);

await run(
  cspell,
  ["**/*.md", "**/*.ts", "**/*.js", "**/changelog.json", "common/changes/**/*.json"],
  {
    cwd: repoRoot,
  }
);
