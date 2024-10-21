import { execAsync, run, RunOptions } from "./common.js";
import { MinimumDotnetVersion } from "./constants.js";

export async function runDotnet(
  args: string[],
  options: Omit<RunOptions, "stdio" | "throwOnNonZeroExit"> = {},
) {
  await ensureDotnetVersion();
  const result = await run("dotnet", args, {
    ...options,
    throwOnNonZeroExit: false,
    stdio: [null, "pipe", "inherit"],
  });

  if (result.exitCode !== 0) {
    // rush wants errors on stderr to show them to user without --verbose.
    // eslint-disable-next-line no-console
    console.error(result.stdout);
    process.exit(result.exitCode);
  }
  // eslint-disable-next-line no-console
  console.log(result.stdout);
}

export async function validateDotnetVersion(): Promise<{ error?: string }> {
  try {
    const result = await execAsync("dotnet", ["--version"], {
      stdio: [null, "pipe", "inherit"],
    });

    if (result.exitCode !== 0 || !result.stdout) {
      return { error: `dotnet not found.` };
    }
    const version = result.stdout.toString().trim();
    const [major, minor, _patch] = version.split(".").map((x) => parseInt(x, 10));

    if (
      major < MinimumDotnetVersion.major ||
      (major === MinimumDotnetVersion.major && minor < MinimumDotnetVersion.minor)
    ) {
      return {
        error: `dotnet version ${version} does not meet minimum requirement ${MinimumDotnetVersion.major}.${MinimumDotnetVersion.minor}.x`,
      };
    }
    return {};
  } catch (e: any) {
    if (e.code === "ENOENT") {
      return { error: "dotnet not found." };
    } else {
      throw e;
    }
  }
}

let validatedDotnet = false;
export async function ensureDotnetVersion(options: { exitWithSuccessInDevBuilds?: boolean } = {}) {
  if (validatedDotnet) {
    return;
  }

  const { error } = await validateDotnetVersion();
  if (error) {
    // If running in CI/AzureDevOps fail if dotnet is invalid.
    if (process.env.CI || process.env.TF_BUILD || !options.exitWithSuccessInDevBuilds) {
      // eslint-disable-next-line no-console
      console.error(`error: ${error}`);
      process.exit(1);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Skipping build step: ${error}`);
      process.exit(0);
    }
  }

  validatedDotnet = true;
}

/**
 * Runs the dotnet formatter.
 */
export async function runDotnetFormat(...args: string[]) {
  return runDotnet([
    "format",
    "whitespace",
    ".",
    `--exclude`,
    "**/node_modules/**/*",
    "--folder",
    ...args,
  ]);
}
