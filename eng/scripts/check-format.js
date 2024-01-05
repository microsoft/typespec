// @ts-check
import {
  CommandFailedError,
  ensureDotnetVersion,
  runDotnetFormat,
} from "../../packages/internal-build-utils/dist/src/index.js";
import { runPrettier } from "./helpers.js";

try {
  await runPrettier("--list-different");
  await ensureDotnetVersion({ exitWithSuccessInDevBuilds: true });
  await runDotnetFormat("--verify-no-changes");
} catch (err) {
  if (err instanceof CommandFailedError) {
    console.error(
      "\nERROR: Files above are not formatted correctly. Run `rush format` and commit the changes."
    );
    process.exit(err.proc?.exitCode ?? 1);
  }
  throw err;
}
