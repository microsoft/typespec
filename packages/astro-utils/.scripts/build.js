#!/usr/bin/env node
import { spawn } from "child_process";
import { mkdir, rm, writeFile } from "fs/promises";
import { join, resolve } from "path";

const projectRoot = resolve(import.meta.dirname, "..");
const skipBuildMarker = join(projectRoot, "temp/turbo-build-skipped");

if (process.env.TYPESPEC_SKIP_WEBSITE_BUILD?.toLowerCase() === "true") {
  await mkdir(join(projectRoot, "temp"), { recursive: true });
  await writeFile(skipBuildMarker, "TYPESPEC_SKIP_WEBSITE_BUILD=true\n");
  console.log("Skipping astro-utils build");
  process.exit(0);
}

await rm(skipBuildMarker, { force: true });
await run("astro", ["check"]);
await run("tsc", ["-p", "./tsconfig.build.json"]);

function run(command, args) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, {
      cwd: projectRoot,
      stdio: "inherit",
      shell: process.platform === "win32",
    });
    child.on("error", (error) => {
      console.error(error.message);
      process.exit(1);
    });
    child.on("exit", (code, signal) => {
      if (signal) {
        process.kill(process.pid, signal);
        return;
      }
      if (code !== 0) {
        process.exit(code ?? 1);
      }
      resolveRun();
    });
  });
}
