import { run } from "../../../eng/scripts/helpers.js";
import { readFileSync } from "fs";

const version = JSON.parse(readFileSync("package.json")).version;
const vsix = `cadl-vscode-${version}.vsix`;

const options = {
  ignoreCommandNotFound: true,
  // Code CLI emits node warnings we can't prevent
  env: { ...process.env, NODE_NO_WARNINGS: 1 },
};

for (const command of ["code", "code-insiders"]) {
  run(command, ["--install-extension", vsix], options);
}
