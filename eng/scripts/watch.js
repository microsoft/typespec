import { repoRoot, run, tsc } from "./helpers.js";
run(tsc, ["--build", "--watch"], { cwd: repoRoot, sync: false });
