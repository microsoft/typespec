// @ts-check
import { resolve } from "path";
import { repoRoot, run } from "./helpers.js";

export const cspell = resolve(repoRoot, "packages/internal-build-utils/node_modules/.bin/cspell");

await run(cspell, ["**/*.md", "**/changelog.json"], {
  cwd: repoRoot,
});
