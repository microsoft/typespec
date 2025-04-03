import { runCommand } from "./utils.js";

runCommand("black", ["generator/", "eng/", "--config", "./eng/scripts/ci/pyproject.toml"]);
