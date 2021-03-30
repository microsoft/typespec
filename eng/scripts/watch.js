import { repoRoot } from "./helpers.js";
import { spawn } from "child_process";
import { resolve } from "path";

const tsc = resolve(repoRoot, "packages/adl/node_modules/.bin/tsc");
const args = ["--build", "--watch"];
spawn(tsc, args, { cwd: repoRoot, shell: true, stdio: "inherit" });
