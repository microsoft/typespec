import { run } from "../../../eng/scripts/helpers.js";
import { join } from "path";
import { readFileSync } from "fs";

if (process.platform !== "win32") {
  console.log("Skipping adl-vs build: not on Windows.");
  process.exit(0);
}

if (process.env.ADL_SKIP_VS_BUILD) {
  console.log("Skipping adl-vs build: ADL_SKIP_VS_BUILD is set.");
  process.exit(0);
}

const vswhere = join(
  process.env["ProgramFiles(x86)"],
  "Microsoft Visual Studio/Installer/vswhere.exe"
);

const vsMinimumVersion = "16.9";
const vswhereArgs = [
  "-latest",
  "-prerelease",
  "-version",
  `[${vsMinimumVersion},`,
  "-property",
  "installationPath",
];

let proc = run(vswhere, vswhereArgs, {
  ignoreCommandNotFound: true,
  throwOnNonZeroExit: false,
  encoding: "utf-8",
  stdio: [null, "pipe", "inherit"],
});

if (proc.status != 0 || proc.error || !proc.stdout) {
  const message = `Visual Studio ${vsMinimumVersion} or later not found`;
  if (process.env.ADL_REQUIRE_VS_BUILD) {
    // In official build on Windows, it's an error if VS is not found.
    console.error(`error: ${message}`);
    process.exit(1);
  } else if (proc.error?.code === "ENOENT") {
    // If developer has no version of VS installed, skip build without warning.
    console.log(`Skipping adl-vs build: ${message}.`);
    process.exit(0);
  } else {
    // If developer has VS but it's not recent enough, skip build with warning.
    console.error(`warning: ${message}. Skipping adl-vs build.`);
    process.exit(0);
  }
}

const version = JSON.parse(readFileSync("package.json")).version;
const msbuild = join(proc.stdout.trim(), "MSBuild/Current/Bin/MSBuild.exe");
const msbuildArgs = ["/p:Configuration=Release", `/p:Version=${version}`];
proc = run(msbuild, msbuildArgs, { throwOnNonZeroExit: false });
process.exit(proc.status ?? 1);
