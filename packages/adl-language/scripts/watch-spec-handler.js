import { watchHandler, run } from "../../../eng/scripts/helpers.js";

watchHandler(() => run("npm", ["run", "build"]));
