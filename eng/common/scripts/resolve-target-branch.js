// @ts-check
console.log("Process", process.env);

const prTargetBranch = process.env["SYSTEM_PULLREQUEST_TARGETBRANCHNAME"];
const currentBranch = process.env["BUILD_SOURCEBRANCH"];

console.log("Branches:", {
  prTargetBranch,
  currentBranch,
});

if (prTargetBranch !== undefined) {
  console.log("Target branch is", prTargetBranch);
  console.log(`##vso[task.setvariable variable=TARGET_BRANCH]${prTargetBranch}`);
} else if (currentBranch) {
  const segments = currentBranch.split("/");
  if (segments[0] === "github-readonly-queue") {
    const targetBranch = segments.slice(1, segments.length - 2).join("/");
    console.log("Target branch is", targetBranch);
    console.log(`##vso[task.setvariable variable=TARGET_BRANCH]${targetBranch}`);
  }
} else {
  console.log("Failed to resolve target branch.");
  process.exit(1);
}
