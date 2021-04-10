import { run } from "../../../eng/scripts/helpers.js";
import { join } from "path";
import { readFileSync } from "fs";

if (process.platform !== "win32") {
  console.log("Skipping adl-vs build: not on Windows.");
  process.exit(0);
}

const ignoreCommandNotFound = !process.env.ADL_REQUIRE_VISUAL_STUDIO_EXTENSION_BUILD;

const vswhere = join(
  process.env["ProgramFiles(x86)"],
  "Microsoft Visual Studio/Installer/vswhere.exe"
);

const proc = run(vswhere, ["-latest", "-prerelease", "-property", "installationPath"], {
  ignoreCommandNotFound,
  encoding: "utf-8",
  stdio: [null, "pipe", "inherit"],
});

if (ignoreCommandNotFound && proc.error?.code === "ENOENT") {
  console.log("Skipping adl-vs build: Visual Studio not found.");
  process.exit(0);
}

const version = JSON.parse(readFileSync("package.json")).version;
const msbuild = join(proc.stdout.trim(), "MSBuild/Current/Bin/MSBuild.exe");
run(msbuild, ["/p:Configuration=Release", `/p:Version=${version}`]);
