// @ts-check
import {
  ensureDotnetVersion,
  exitOnFailedCommand,
  runDotnetFormat,
} from "../../packages/internal-build-utils/dist/src/index.js";
import { runPrettier } from "./helpers.js";

await exitOnFailedCommand(() => runPrettier("--write"));

await ensureDotnetVersion({ exitWithSuccessInDevBuilds: true });
await runDotnetFormat();
