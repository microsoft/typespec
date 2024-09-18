// @ts-check
/* eslint-disable no-console */
import {
  ensureDotnetVersion,
  getVisualStudioMsBuildPath,
  run,
  runDotnet,
} from "@typespec/internal-build-utils";
import { readFile } from "fs/promises";
import { dirname, join, resolve } from "path";
import { fileURLToPath } from "url";

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

async function main() {
  if (process.env.TYPESPEC_SKIP_VS_BUILD) {
    console.log("TYPESPEC_SKIP_VS_BUILD is set, skipping build.");
    process.exit(0);
  }

  const pkgRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
  const file = await readFile(join(pkgRoot, "package.json"), "utf-8");
  const version = JSON.parse(file).version;

  const result = await getBuildTool();
  if (result.type === "dotnet") {
    await ensureDotnetVersion({ exitWithSuccessInDevBuilds: true });
    await runDotnet(
      ["build", "--configuration", "Release", `-p:Version=${version}`, "-clp:NoSummary"],
      {
        cwd: pkgRoot,
      },
    );
  } else {
    await buildWithMsbuild(result.path, pkgRoot, version);
  }
}

async function buildWithMsbuild(msbuildPath, pkgRoot, version) {
  const msbuildArgs = [
    "/m",
    "/v:m",
    "/noAutoRsp",
    "/p:Configuration=Release",
    `/p:Version=${version}`,
  ];

  if (!process.env.TYPESPEC_VS_CI_BUILD) {
    // In developer builds, restore on every build
    msbuildArgs.push("/restore");
  }
  msbuildArgs.push(join(pkgRoot, "Microsoft.TypeSpec.VS.sln"));
  const result = await run(msbuildPath, msbuildArgs, { throwOnNonZeroExit: false });
  process.exit(result.exitCode);
}

async function getBuildTool() {
  if (process.platform !== "win32") {
    console.log("Not on windows using 'dotnet' to build");
    return { type: "dotnet" };
  }

  const result = await getVisualStudioMsBuildPath();
  if ("path" in result) {
    return { type: "msbuild", path: result.path };
  } else {
    if (process.env.TYPESPEC_VS_CI_BUILD) {
      // In official build on Windows, it's an error if VS is not found.
      console.error(`error: ${result.error}`);
      process.exit(1);
    } else {
      console.log(`Msbuild not found. Using 'dotnet' to build typespec-vs`);
      return { type: "dotnet" };
    }
  }
}
