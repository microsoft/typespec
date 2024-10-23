// @ts-check
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
  const match = currentBranch.match(/refs\/heads\/gh-readonly-queue\/(.*)\/pr-.*/);
  if (match !== null) {
    const targetBranch = match[1];
    console.log("Target branch is", targetBranch);
    console.log(`##vso[task.setvariable variable=TARGET_BRANCH]${targetBranch}`);
  }
} else {
  console.log("Failed to resolve target branch.");
  process.exit(1);
}
