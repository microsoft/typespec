// Runs the npm run command on each project that has it.
import { npmForEach } from "./helpers.js";

npmForEach(process.argv[2]);
