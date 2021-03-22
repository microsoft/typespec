const { spawn } = require("child_process");
const { resolve } = require("path");
const root = resolve(__dirname, "../../");
const tsc = resolve(root, "packages/adl/node_modules/.bin/tsc");
const args = ["--build", "--watch"];
spawn(tsc, args, { cwd: root, shell: true, stdio: "inherit" });
