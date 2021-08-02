import { repoRoot, run } from "../../../eng/scripts/helpers.js";
import { join } from "path";
import { readFileSync } from "fs";

if (process.platform !== "win32") {
  console.log("Skipping cadl-vs build: not on Windows.");
  process.exit(0);
}

if (process.env.CADL_SKIP_VS_BUILD) {
  console.log("Skipping cadl-vs build: CADL_SKIP_VS_BUILD is set.");
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
  if (process.env.CADL_VS_CI_BUILD) {
    // In official build on Windows, it's an error if VS is not found.
    console.error(`error: ${message}`);
    process.exit(1);
  } else {
    console.log(`Skipping cadl-vs build: ${message}.`);
    process.exit(0);
  }
}

const dir = join(repoRoot, "packages/cadl-vs");
const version = JSON.parse(readFileSync(join(dir, "package.json"))).version;
const msbuild = join(proc.stdout.trim(), "MSBuild/Current/Bin/MSBuild.exe");
const msbuildArgs = [
  "/m",
  "/v:m",
  "/noAutoRsp",
  "/p:Configuration=Release",
  `/p:Version=${version}`,
];

if (process.argv[2] === "--restore") {
  // In official builds, restore is run in a separate invocation for better build telemetry.
  msbuildArgs.push("/target:restore");
} else if (!process.env.CADL_VS_CI_BUILD) {
  // In developer builds, restore on every build
  msbuildArgs.push("/restore");
}

msbuildArgs.push(join(dir, "Microsoft.Cadl.VS.sln"));
proc = run(msbuild, msbuildArgs, { throwOnNonZeroExit: false });
process.exit(proc.status ?? 1);
