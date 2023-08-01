// @ts-check

// Runs the npm run command on each project that has it.
import { npmForEachDependency } from "./helpers.js";

npmForEachDependency(process.argv[2], process.cwd());
