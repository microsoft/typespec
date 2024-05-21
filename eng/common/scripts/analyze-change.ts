import { parseArgs } from "util";
import { repoRoot } from "./utils/common.js";
import { listChangedFilesSince } from "./utils/git.js";

const args = parseArgs({
  args: process.argv.slice(2),
  options: {
    "target-branch": { type: "string" },
  },
});

const targetBranch = args.values["target-branch"];
if (!targetBranch) {
  console.error("--target-branch is required");
  process.exit(1);
}

console.log("Checking for changes in current branch compared to $TargetBranch");

const files = await listChangedFilesSince(targetBranch, { repositoryPath: repoRoot });

console.log("##[group]Files changed in this pr");
console.log(files.map((x) => ` - ${x}`).join("\n"));
console.log("##[endgroup]");
