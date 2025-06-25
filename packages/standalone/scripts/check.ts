import { execa } from "execa";
import { mkdir, rm, writeFile } from "fs/promises";
import { resolve } from "path";

const projectDir = resolve(import.meta.dirname, "..");
const distDir = resolve(projectDir, "dist");
const exe = process.platform === "win32" ? "tsp.exe" : "tsp";
const exePath = resolve(distDir, exe);
await main();

async function main() {
  await commandRuns();
  if (process.argv.includes("--smoke-only")) {
    return;
  }
  await installWorks();
}

async function run(args: string[], options: { cwd?: string; env?: Record<string, string> } = {}) {
  return await execa(exePath, args, options);
}

async function commandRuns() {
  const result = await run(["--help"]);
  if (result.stdout.includes("tsp <command>")) {
    console.log("✅ command working!");
  } else {
    console.error("Executable is not working");
    console.error(result.stdout);
    console.error("Std err----------------");
    console.error(result.stderr);
    process.exit(1);
  }
}

async function installWorks() {
  const testDir = resolve(projectDir, "temp", "install-test");
  await rm(testDir, { recursive: true, force: true });
  await mkdir(testDir, { recursive: true });
  await writeFile(
    resolve(testDir, "package.json"),
    JSON.stringify({ name: "test", dependencies: { "@typespec/compiler": "latest" } }),
  );
  await run(["install"], {
    cwd: testDir,
    env: {
      TYPESPEC_COMPILER_PATH: resolve(projectDir, "..", "compiler", "cmd", "tsp.js"),
    },
  });

  console.log("✅ install working!");
}
