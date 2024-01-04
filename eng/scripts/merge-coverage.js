// @ts-check
import { copyFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { runOrExit } from "../../packages/internal-build-utils/dist/src/index.js";
import { forEachProject, repoRoot } from "./helpers.js";

// Create folder to collect all coverage files
const rootCoverageTmp = join(repoRoot, "coverage", "tmp");
mkdirSync(rootCoverageTmp, { recursive: true });

// Copy coverage files from each project to common folder
forEachProject((name, location, project) => {
  const coverageTmp = join(location, "coverage", ".tmp");
  if (existsSync(coverageTmp)) {
    const files = readdirSync(coverageTmp);
    for (const file of files) {
      copyFileSync(join(coverageTmp, file), join(rootCoverageTmp, file));
    }
  }
});

// Generate merged report
await runOrExit(
  "npm",
  [
    "exec",
    "--no",
    "--prefix",
    "packages/compiler",
    "c8",
    "--",
    "report",
    "--reporter=cobertura",
    "--reporter=text",
  ],
  {
    cwd: repoRoot,
  }
);
