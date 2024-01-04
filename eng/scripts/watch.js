import { repoRoot, run, tsc } from "./helpers.js";
run(tsc, ["--build", "./tsconfig.ws.json", "--watch"], { cwd: repoRoot, sync: false });
