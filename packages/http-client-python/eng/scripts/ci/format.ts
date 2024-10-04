import { runCommand } from "./utils.js";

runCommand("black . --config ./eng/scripts/ci/pyproject.toml", "black");
