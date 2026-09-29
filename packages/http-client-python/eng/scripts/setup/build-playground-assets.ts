import { rm } from "node:fs/promises";
import { runPython3 } from "./run-python3.js";

const cfsPythonIndex = "https://packagefeedproxy.microsoft.io/pypi/simple/";
process.env.PIP_INDEX_URL = cfsPythonIndex;
process.env.UV_DEFAULT_INDEX = cfsPythonIndex;

try {
  await runPython3("./eng/scripts/setup/build_playground_assets.py");
} finally {
  await rm("./venv_build_wheel", { recursive: true, force: true });
}
