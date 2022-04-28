// @ts-check
import { runDotnetFormat } from "../../packages/internal-build-utils/dist/src/index.js";
import { runPrettier } from "./helpers.js";
runPrettier("--write");
await runDotnetFormat();
