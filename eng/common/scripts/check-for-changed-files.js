// @ts-check
import { run } from "../../tsp-core/scripts/legacy-helpers.js";

const proc = run("git", ["status", "--porcelain"], {
  encoding: "utf-8",
  stdio: [null, "pipe", "pipe"],
});

if (proc.stdout) {
  console.log(proc.stdout);
}

if (proc.stderr) {
  console.error(proc.stderr);
}

if (proc.stdout || proc.stderr) {
  if (process.argv[2] !== "publish") {
    console.error(
      `ERROR: Files above were changed during PR validation, but not included in the PR.
Include any automated changes such as sample output, spec.html, and ThirdPartyNotices.txt in your PR.`,
    );
  } else {
    console.error(
      `ERROR: Changes have been made since this publish PR was prepared.
In the future, remember to alert coworkers to avoid merging additional changes while publish PRs are in progress.
Close this PR, run prepare-publish again.`,
    );
  }
  process.exit(1);
}
