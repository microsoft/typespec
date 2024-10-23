// @ts-check
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";
const root = fileURLToPath(new URL("..", import.meta.url).href);
const distDir = join(root, "dist");
const versionTarget = join(distDir, "version.js");

function loadPackageJson() {
  const packageJsonPath = join(root, "package.json");
  return JSON.parse(readFileSync(packageJsonPath, "utf-8"));
}

function main() {
  const pkg = loadPackageJson();

  const version = pkg.version;

  if (!existsSync(distDir)) {
    mkdirSync(distDir, { recursive: true });
  }

  const versionJs = `export const version = "${version}";`;
  writeFileSync(versionTarget, versionJs);
}

main();
