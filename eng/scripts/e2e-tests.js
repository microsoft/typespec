// @ts-check
import { repoRoot, run } from "./helpers.js";
import { join } from "path";
import { existsSync, readdirSync, rmSync } from "fs";

const e2eTestDir = join(repoRoot, "e2e");
const cadlCmd = process.platform === "win32" ? "cadl.cmd" : "cadl";

function main() {
  const packages = packPackages();
  console.log("Pack", packages);
  installCompiler(packages["@cadl-lang/compiler"]);
  testBasicLatest();
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

function installCompiler(compilerTgz) {
  console.log("Installing compiler globally with", compilerTgz);
  run("npm", ["install", "-g", compilerTgz], { cwd: repoRoot });
  console.log("Installed compiller globally");
}

function testBasicLatest() {
  const basicLatestDir = join(e2eTestDir, "basic-latest");
  const outputDir = join(basicLatestDir, "cadl-output");
  console.log("Clearing basic-latest output");
  rmSync(outputDir, { recursive: true });
  console.log("Cleared basic-latest output");

  console.log("Installing basic-latest dependencies");
  run(cadlCmd, ["install"], { cwd: basicLatestDir });
  console.log("Installed basic-latest dependencies");

  console.log("Running cadl compile .");
  run(cadlCmd, ["compile", "."], { cwd: basicLatestDir });
  console.log("Completed cadl compile .");

  if (existsSync(join(outputDir, "openapi.json"))) {
    console.log("Output created successfully.");
  } else {
    throw new Error("Test basic latest failed to produce output openapi.json");
  }
}
