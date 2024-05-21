import { parseArgs } from "util";
import { setOutputVariable } from "./utils/ado.js";
import { repoRoot } from "./utils/common.js";
import { findAreasChanged } from "./utils/find-area-changed.js";
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

const files = await listChangedFilesSince(`origin/${targetBranch}`, { repositoryPath: repoRoot });

console.log("##[group]Files changed in this pr");
console.log(files.map((x) => ` - ${x}`).join("\n"));
console.log("##[endgroup]");

const areaChanged = findAreasChanged(files);

for (const area of areaChanged) {
  console.log(`Setting output variable Run${area} to true`);
  setOutputVariable(`Run${area}`, "true");
}
