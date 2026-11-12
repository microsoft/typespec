#!/usr/bin/env node
import { runOrExit } from "@typespec/internal-build-utils";
import { copyFile, mkdir, rm, writeFile } from "fs/promises";
import { join, resolve } from "path";

export const repoRoot = resolve(import.meta.dirname, "../..");
export const projectRoot = resolve(import.meta.dirname, "..");
const skipBuildMarker = join(projectRoot, "temp/turbo-build-skipped");

if (process.env.TYPESPEC_SKIP_WEBSITE_BUILD?.toLowerCase() === "true") {
  await mkdir(join(projectRoot, "temp"), { recursive: true });
  await writeFile(skipBuildMarker, "TYPESPEC_SKIP_WEBSITE_BUILD=true\n");
  console.log("Skipping website build: TYPESPEC_SKIP_WEBSITE_BUILD=true");
  process.exit(0);
}

await rm(skipBuildMarker, { force: true });
await copyFile(
  join(repoRoot, "packages/standalone/install.sh"),
  join(projectRoot, "public/install.sh"),
);
await copyFile(
  join(repoRoot, "packages/standalone/install.ps1"),
  join(projectRoot, "public/install.ps1"),
);
await runOrExit("npm", ["run", "build:web"]);
