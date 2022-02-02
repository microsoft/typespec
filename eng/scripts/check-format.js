import { CommandFailedError, runPrettier } from "./helpers.js";

try {
  runPrettier("--list-different");
} catch (err) {
  if (err instanceof CommandFailedError) {
    console.error(
      "\nERROR: Files above are not formatted correctly. Run `rush format` and commit the changes."
    );
    process.exit(err.proc?.status ?? 1);
  }
  throw err;
}
