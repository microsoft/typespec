#!/usr/bin/env node
import { runOrExit } from "@typespec/internal-build-utils";
import { copyFile } from "fs/promises";
import { join, resolve } from "path";

if (process.env.TYPESPEC_SKIP_DOCUSAURUS_BUILD?.toLowerCase() === "true") {
  console.log("Skipping docusaurus build: TYPESPEC_SKIP_DOCUSAURUS_BUILD=true");
  process.exit(0);
}

export const repoRoot = resolve(import.meta.dirname, "../..");
export const projectRoot = resolve(import.meta.dirname, "..");

await copyFile(
  join(repoRoot, "packages/standalone/install.sh"),
  join(projectRoot, "public/install.sh"),
);
await copyFile(
  join(repoRoot, "packages/standalone/install.ps1"),
  join(projectRoot, "public/install.ps1"),
);
await runOrExit("npm", ["run", "build:web"]);
