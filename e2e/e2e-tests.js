// @ts-check
import { existsSync, readdirSync, rmSync, writeFileSync } from "fs";
import { join } from "path";
import { repoRoot, run } from "../eng/scripts/helpers.js";

const e2eTestDir = join(repoRoot, "e2e");
const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";

function main() {
  cleanE2EDirectory();
  const packages = packPackages();
  testBasicLatest(packages);
  testBasicCurrentTgz(packages);
}
main();

function cleanE2EDirectory() {
  run("git", ["clean", "-xfd"], { cwd: e2eTestDir });
}

function packPackages() {
  run("rush", ["publish", "--publish", "--pack", "--include-all"]);
  const outputFolder = join(repoRoot, "common/temp/artifacts/packages");
  const files = readdirSync(outputFolder);
  console.log("Built packages:", files);

  function resolvePackage(start) {
    return join(
      outputFolder,
      files.find((x) => x.startsWith(start))
    );
  }

  return {
    "@cadl-lang/compiler": resolvePackage("cadl-lang-compiler-"),
    "@cadl-lang/openapi": resolvePackage("cadl-lang-openapi-"),
    "@cadl-lang/openapi3": resolvePackage("cadl-lang-openapi3-"),
    "@cadl-lang/rest": resolvePackage("cadl-lang-rest-"),
    "@cadl-lang/versioning": resolvePackage("cadl-lang-versioning-"),
  };
}

function runCadl(compilerTgz, args, options) {
  run(npxCmd, ["-p", compilerTgz, "cadl", ...args], { ...options });
}

function testBasicLatest(packages) {
  const basicLatestDir = join(e2eTestDir, "basic-latest");
  const outputDir = join(basicLatestDir, "cadl-output");
  console.log("Clearing basic-latest output");
  rmSync(outputDir, { recursive: true, force: true });
  console.log("Cleared basic-latest output");

  console.log("Installing basic-latest dependencies");
  runCadl(packages["@cadl-lang/compiler"], ["install"], { cwd: basicLatestDir });
  console.log("Installed basic-latest dependencies");

  console.log("Running cadl compile .");
  runCadl(packages["@cadl-lang/compiler"], ["compile", ".", "--emit", "@cadl-lang/openapi3"], {
    cwd: basicLatestDir,
  });
  console.log("Completed cadl compile .");

  if (existsSync(join(outputDir, "openapi.json"))) {
    console.log("Output created successfully.");
  } else {
    throw new Error("Test basic latest failed to produce output openapi.json");
  }
}

function testBasicCurrentTgz(packages) {
  const basicCurrentDir = join(e2eTestDir, "basic-current");
  const outputDir = join(basicCurrentDir, "cadl-output");
  console.log("Clearing basic-current");
  rmSync(outputDir, { recursive: true, force: true });
  console.log("Cleared basic-current");

  console.log("Generating package.json for basic-current");
  const packageJson = {
    name: "@cadl-lang/e2e-test-basic-current",
    dependencies: {
      "@cadl-lang/compiler": packages["@cadl-lang/compiler"],
      "@cadl-lang/rest": packages["@cadl-lang/rest"],
      "@cadl-lang/openapi": packages["@cadl-lang/openapi"],
      "@cadl-lang/openapi3": packages["@cadl-lang/openapi3"],
      "@cadl-lang/versioning": packages["@cadl-lang/versioning"],
    },
    private: true,
  };
  writeFileSync(join(basicCurrentDir, "package.json"), JSON.stringify(packageJson, null, 2));
  console.log("Generated package.json for basic-current");

  console.log("Installing basic-current dependencies");
  runCadl(packages["@cadl-lang/compiler"], ["install"], { cwd: basicCurrentDir });
  console.log("Installed basic-current dependencies");

  console.log(`Running cadl compile . in "${basicCurrentDir}"`);
  runCadl(packages["@cadl-lang/compiler"], ["compile", ".", "--emit", "@cadl-lang/openapi3"], {
    cwd: basicCurrentDir,
  });
  console.log("Completed cadl compile .");

  if (existsSync(join(outputDir, "openapi.json"))) {
    console.log("Output created successfully.");
  } else {
    throw new Error("Test basic latest failed to produce output openapi.json");
  }
}
