import { run } from "../../packages/internal-build-utils/dist/src/index.js";
import { repoRoot, tsc } from "./helpers.js";

run(tsc, ["--build", "--watch"], { cwd: repoRoot, sync: false });
