import { execSync } from "child_process";
import { repoRoot } from "../common/scripts/utils/common.js";
import { listChangedFilesSince } from "../common/scripts/utils/git.js";
import { getPublishablePackages } from "./tpm/packages.js";

const files = await listChangedFilesSince(`origin/main`, { repositoryPath: repoRoot });

// eslint-disable-next-line no-console
console.log("modified files:", files);

const packages = await getPublishablePackages();
const paths = packages.map((pkg) => pkg.path);

const modifiedPaths = paths.filter((x) => files.some((f) => f.startsWith(x + "/")));
// eslint-disable-next-line no-console
console.log("Packages", { all: paths, modified: modifiedPaths });
if (modifiedPaths.length === 0) {
  // eslint-disable-next-line no-console
  console.log("No modified packages found.");
  process.exit(0);
}
try {
  execSync(`pnpx pkg-pr-new publish ${modifiedPaths.map((x) => `'${x}'`).join(" ")} --pnpm`, {
    stdio: "inherit",
    encoding: "utf-8",
    cwd: repoRoot,
  });
} catch (e: any) {
  // eslint-disable-next-line no-console
  console.error("Failed to run pkg-pr-new publish");
  process.exit(1);
}
