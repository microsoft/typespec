// @ts-check
import {
  ensureDotnetVersion,
  runDotnetFormat,
} from "../../packages/internal-build-utils/dist/src/index.js";
import { runPrettier } from "./helpers.js";
runPrettier("--write");

await ensureDotnetVersion({ exitWithSuccessInDevBuilds: true });
await runDotnetFormat();
