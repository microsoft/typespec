import { forEachProject, repoRoot, run } from "./helpers.js";
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";

const rootCoverageTmp = join(repoRoot, "coverage", "tmp");
mkdirSync(rootCoverageTmp, { recursive: true });

forEachProject((name, location, project) => {
  const coverageTmp = join(location, "coverage", "tmp");
  if (existsSync(coverageTmp)) {
    const files = readdirSync(coverageTmp);
    for (const file of files) {
      copyFileSync(join(coverageTmp, file), join(rootCoverageTmp, file));
    }
  }
});

run(
  "npx",
  [
    "--no",
    "--prefix packages/compiler",
    "c8",
    "report",
    "--reporter=cobertura",
    "--reporter=text"
  ],
  {
    cwd: repoRoot,
  }
);
