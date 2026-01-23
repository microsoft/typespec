import { execSync } from "child_process";
import { readdir } from "fs/promises";
import { repoRoot } from "../common/scripts/utils/common.js";
import { listChangedFilesSince } from "../common/scripts/utils/git.js";

const files = await listChangedFilesSince(`origin/main`, { repositoryPath: repoRoot });

// eslint-disable-next-line no-console
console.log("modified files:", files);

const packages = await readdir(repoRoot + "/packages", { withFileTypes: true });
const paths = packages
  .filter((dirent) => dirent.isDirectory() && dirent.name !== "http-client-python")
  .map((dirent) => `packages/${dirent.name}`);

const modifiedPaths = paths.filter((x) => files.some((f) => f.startsWith(x)));
// eslint-disable-next-line no-console
console.log("Packages", { all: paths, modified: modifiedPaths });
try {
  execSync(`pnpx pkg-pr-new publish ${modifiedPaths.map((x) => `'${x}'`).join(" ")} --pnpm`, {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: repoRoot,
  });
} catch (e: any) {
  // eslint-disable-next-line no-console
  console.error("Failed to run pkg-pr-new publish");
}
