import { spawnSync } from "child_process";
import { readFileSync } from "fs";

const version = JSON.parse(readFileSync("package.json")).version;
run("npm", "pack");
run("npm", "install", "-g", `azure-tools-adl-${version}.tgz`);

function run(command, ...args) {
  console.log();
  console.log(`> ${command} ${args.join(" ")}`);
  if (process.platform === "win32") {
    command += ".cmd";
  }
  const proc = spawnSync(command, args, { stdio: "inherit" });
  if (proc.error) {
    throw proc.error;
  }
  if (proc.status !== 0) {
    throw new Error(
      `Command '${command} ${args.join(" ")}' failed" with exit code ${proc.status}.`
    );
  }
}
