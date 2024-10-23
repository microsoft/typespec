import { joinPaths } from "@typespec/compiler";
import { spawnSync } from "child_process";
import { readdir } from "fs/promises";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

export async function generateTypeSpec(folder: string) {
  const testRoot = joinPaths(__dirname, "..", folder);

  const testDir = await readdir(testRoot);
  if (!testDir.length) {
    throw new Error(`No files found in ${testRoot}`);
  }

  // Check for yml or json file for the service
  const serviceEntry = testDir.includes("service.yml")
    ? "service.yml"
    : testDir.includes("service.json")
      ? "service.json"
      : "";

  if (!serviceEntry) {
    throw new Error(`Could not find "service.(yml|json)" in ${testRoot}`);
  }

  const args = [
    resolve(__dirname, "..", "..", "..", "cmd", "openapi3-to-tsp.js"),
    "compile",
    "--output-dir",
    joinPaths(testRoot, "tsp"),
    joinPaths(testRoot, serviceEntry),
  ];

  const spawn = spawnSync("node", args);
  if (spawn.status !== 0) {
    throw new Error(
      `Generation failed, command:\n openapi3-to-tsp ${args.join(" ")}\nStdout:\n${spawn.stdout}\nStderr:\n${spawn.stderr}`,
    );
  }
}

async function main() {
  const root = joinPaths(__dirname, "..");
  const folders = (await readdir(root)).filter((d) => d !== "utils");

  for (const folder of folders) {
    await generateTypeSpec(folder);
  }
}

main().catch((e) => {
  // eslint-disable-next-line no-console
  console.error(e);
});
