// @ts-check
import { runOrExit } from "../../packages/internal-build-utils/dist/src/common.js";
import { npmForEach } from "./helpers.js";
await runOrExit("rush", ["update"]);
await runOrExit("rush", ["build"]);
npmForEach("dogfood");
