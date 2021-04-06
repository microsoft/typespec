import { run } from "./helpers.js";

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
  console.error(
    `ERROR: Files above were changed during PR validation, but not included in the PR.
Include any automated changes such as sample output, spec.html, and ThirdPartyNotices.txt in your PR.`
  );
  process.exit(1);
}
