// @ts-check
import { repoRoot, run } from "../eng/scripts/helpers.js";
import { join } from "path";
import { existsSync, readdirSync, rmSync, writeFileSync } from "fs";

const e2eTestDir = join(repoRoot, "e2e");
const cadlCmd = process.platform === "win32" ? "cadl.cmd" : "cadl";

function main() {
  const packages = packPackages();
  testBasicLatest(packages);
  testBasicCurrentTgz(packages);
}
main();

function packPackages() {
  run("rush", ["publish", "--publish", "--pack", "--include-all"]);
  const outputFolder = join(repoRoot, "common/temp/artifacts/packages");
  const files = readdirSync(outputFolder);
  console.log("Built packages:", files);

  function resolvePacakge(start) {
    return join(
      outputFolder,
      files.find((x) => x.startsWith(start))
    );
  }

  return {
    "@cadl-lang/compiler": resolvePacakge("cadl-lang-compiler-"),
    "@cadl-lang/openapi3": resolvePacakge("cadl-lang-openapi3-"),
    "@cadl-lang/rest": resolvePacakge("cadl-lang-rest-"),
  };
}

function runCadl(compilerTgz, args, options) {
  run("npx", [compilerTgz, ...args], options);
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
  runCadl(packages["@cadl-lang/compiler"], ["compile", "."], { cwd: basicLatestDir });
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
    name: "basic-latest",
    dependencies: {
      "@cadl-lang/compiler": packages["@cadl-lang/compiler"],
      "@cadl-lang/rest": packages["@cadl-lang/rest"],
      "@cadl-lang/openapi3": packages["@cadl-lang/openapi3"],
    },
    private: true,
  };
  writeFileSync(join(basicCurrentDir, "package.json"), JSON.stringify(packageJson, null, 2));
  console.log("Generatedpackage.json for basic-current");

  console.log("Installing basic-latest dependencies");
  runCadl(packages["@cadl-lang/compiler"], ["install"], { cwd: basicCurrentDir });
  console.log("Installed basic-latest dependencies");

  console.log("Running cadl compile .");
  runCadl(packages["@cadl-lang/compiler"], ["compile", "."], { cwd: basicCurrentDir });
  console.log("Completed cadl compile .");

  if (existsSync(join(outputDir, "openapi.json"))) {
    console.log("Output created successfully.");
  } else {
    throw new Error("Test basic latest failed to produce output openapi.json");
  }
}
