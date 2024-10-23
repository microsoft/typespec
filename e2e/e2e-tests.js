/* eslint-disable no-console */
// @ts-check
import { existsSync, readdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { repoRoot } from "../eng/common/scripts/helpers.js";
import { runOrExit } from "../packages/internal-build-utils/dist/src/index.js";

const e2eTestDir = join(repoRoot, "e2e");
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

async function main() {
  printInfo();
  await cleanE2EDirectory();
  const packages = await packPackages();

  console.log("Check packages exists");
  await runOrExit("ls", [`${repoRoot}/temp/artifacts`]);

  console.log("Check cli is working");
  await runTypeSpec(packages["@typespec/compiler"], ["--help"], { cwd: e2eTestDir });
  console.log("Cli is working");

  await testBasicLatest(packages);
  await testBasicCurrentTgz(packages);
}
await main();

function printInfo() {
  console.log("-".repeat(100));
  console.log("Npm Version: ");
  runOrExit("npm", ["-v"]);
  console.log("-".repeat(100));
}

async function cleanE2EDirectory() {
  await runOrExit("git", ["clean", "-xfd"], { cwd: e2eTestDir });
}

async function packPackages() {
  await runOrExit("pnpm", ["-w", "pack:all"], { cwd: repoRoot });
  const outputFolder = join(repoRoot, "/temp/artifacts");
  const files = readdirSync(outputFolder);
  console.log("Built packages:", files);

  function resolvePackage(start) {
    const pkgName = files.find((x) => x.startsWith(start));
    if (pkgName === undefined) {
      throw new Error(`Cannot resolve package starting with "${start}"`);
    }
    return join(outputFolder, pkgName);
  }

  return {
    "@typespec/compiler": resolvePackage("typespec-compiler-"),
    "@typespec/openapi": resolvePackage("typespec-openapi-"),
    "@typespec/openapi3": resolvePackage("typespec-openapi3-"),
    "@typespec/http": resolvePackage("typespec-http-"),
    "@typespec/rest": resolvePackage("typespec-rest-"),
    "@typespec/versioning": resolvePackage("typespec-versioning-"),
  };
}

async function runTypeSpec(compilerTgz, args, options) {
  await runOrExit(npxCmd, ["-y", "-p", compilerTgz, "tsp", ...args], { ...options });
}

async function testBasicLatest(packages) {
  const basicLatestDir = join(e2eTestDir, "basic-latest");
  const outputDir = join(basicLatestDir, "tsp-output");
  console.log("Clearing basic-latest output");
  rmSync(outputDir, { recursive: true, force: true });
  console.log("Cleared basic-latest output");

  console.log("Installing basic-latest dependencies");
  await runTypeSpec(packages["@typespec/compiler"], ["install"], { cwd: basicLatestDir });
  console.log("Installed basic-latest dependencies");

  console.log("Running tsp compile .");
  await runTypeSpec(
    packages["@typespec/compiler"],
    ["compile", ".", "--emit", "@typespec/openapi3"],
    {
      cwd: basicLatestDir,
    },
  );
  console.log("Completed tsp compile .");

  expectOpenApiOutput(outputDir);
}

async function testBasicCurrentTgz(packages) {
  const basicCurrentDir = join(e2eTestDir, "basic-current");
  const outputDir = join(basicCurrentDir, "tsp-output");
  console.log("Clearing basic-current");
  rmSync(outputDir, { recursive: true, force: true });
  console.log("Cleared basic-current");

  console.log("Generating package.json for basic-current");
  const packageJson = {
    name: "@typespec/e2e-test-basic-current",
    dependencies: {
      "@typespec/compiler": packages["@typespec/compiler"],
      "@typespec/http": packages["@typespec/http"],
      "@typespec/rest": packages["@typespec/rest"],
      "@typespec/openapi": packages["@typespec/openapi"],
      "@typespec/openapi3": packages["@typespec/openapi3"],
      "@typespec/versioning": packages["@typespec/versioning"],
    },
    private: true,
  };
  writeFileSync(join(basicCurrentDir, "package.json"), JSON.stringify(packageJson, null, 2));
  console.log("Generated package.json for basic-current");

  console.log("Installing basic-current dependencies");
  await runTypeSpec(packages["@typespec/compiler"], ["install"], { cwd: basicCurrentDir });
  console.log("Installed basic-current dependencies");

  console.log(`Running tsp compile . in "${basicCurrentDir}"`);
  await runTypeSpec(
    packages["@typespec/compiler"],
    ["compile", ".", "--emit", "@typespec/openapi3"],
    {
      cwd: basicCurrentDir,
    },
  );
  console.log("Completed tsp compile .");

  expectOpenApiOutput(outputDir);
}

function expectOpenApiOutput(outputDir) {
  const expectedOutputFile = join(outputDir, "@typespec/openapi3/openapi.yaml");
  if (existsSync(expectedOutputFile)) {
    console.log("Output created successfully.");
  } else {
    throw new Error(`Test failed to produce openapi output at "${expectedOutputFile}"`);
  }
}
