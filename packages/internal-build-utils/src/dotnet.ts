import { execAsync, run, RunOptions } from "./common.js";
import { minimumDotnetVersion } from "./constants.js";

export async function runDotnetOrExit(args: string[], options: RunOptions = {}) {
  await ensureDotnetVersionOrExit();
  return run("dotnet", args, options);
}

export async function validateDotnetVersion(): Promise<{ error?: string }> {
  try {
    const result = await execAsync("dotnet", ["--version"], {
      stdio: [null, "pipe", "inherit"],
    });

    if (result.exitCode !== 0 || !result.stdout) {
      return { error: `Skipping dotnet build: dotnet command was not found found.` };
    }
    const version = result.stdout.toString().trim();
    const [major, minor, _patch] = version.split(".").map((x) => parseInt(x, 10));

    if (
      major < minimumDotnetVersion.major ||
      (major === minimumDotnetVersion.major && minor < minimumDotnetVersion.minor)
    ) {
      return {
        error: `dotnet command version "${version}" is not maching minimum requirement of ${minimumDotnetVersion.major}.${minimumDotnetVersion.minor}.x`,
      };
    }
    return {};
  } catch (e: any) {
    if (e.code === "ENOENT") {
      return { error: "dotnet command was not found found." };
    } else {
      throw e;
    }
  }
}

let validatedDotnet = false;
export async function ensureDotnetVersionOrExit() {
  if (validatedDotnet) {
    return;
  }

  const { error } = await validateDotnetVersion();
  if (error) {
    // If running in CI/AzureDevOps fail if dotnet is invalid.
    if (process.env.CI || process.env.TF_BUILD) {
      // eslint-disable-next-line no-console
      console.error(`error: ${error}`);
      process.exit(1);
    } else {
      // eslint-disable-next-line no-console
      console.log(`Skipping cadl-vs build: ${error}.`);
      process.exit(0);
    }
  }

  validatedDotnet = true;
}

/**
 * Runs the dotnet formatter.
 */
export async function runDotnetFormat(...args: string[]) {
  return runDotnetOrExit([
    "format ",
    "whitespace",
    ".",
    `--exclude`,
    "**/node_modules/**/*",
    "--folder",
    ...args,
  ]);
}
