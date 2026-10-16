import { rm } from "node:fs/promises";
import { runPython3 } from "./run-python3.js";

try {
  await runPython3("./eng/scripts/setup/build_playground_assets.py");
} finally {
  await rm("./venv_build_wheel", { recursive: true, force: true });
}
