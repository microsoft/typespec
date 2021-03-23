const { spawnSync } = require("child_process");
const { readFileSync } = require("fs");

const version = JSON.parse(readFileSync("package.json")).version;
run("npm", "pack");
run("code", "--install-extension", `adl-vscode-${version}.vsix`);
run("code-insiders", "--install-extension", `adl-vscode-${version}.vsix`);

function run(command, ...args) {
  console.log();
  console.log(`> ${command} ${args.join(" ")}`);
  if (process.platform === "win32") {
    command += ".cmd";
  }
  const proc = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, NODE_NO_WARNINGS: "1" },
  });
  if (proc.error) {
    if (proc.error.code === "ENOENT") {
      console.log(`Skipping ${command}: not found.`);
    } else {
      throw proc.error;
    }
  } else if (proc.status !== 0) {
    throw new Error(
      `Command '${command} ${args.join(" ")}' failed" with exit code ${proc.status}.`
    );
  }
}
