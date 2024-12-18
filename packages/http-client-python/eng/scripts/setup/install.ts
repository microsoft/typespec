import fs from "fs";
import path, { dirname } from "path";
import { loadPyodide } from "pyodide";
import { fileURLToPath } from "url";
import { runPython3 } from "./run-python3.js";

async function main() {
  try {
    await runPython3("./eng/scripts/setup/install.py");
    console.log("Found Python on your local environment and created a venv with all requirements."); // eslint-disable-line no-console
  } catch (error) {
    console.log("No Python found on your local environment. We will use Pyodide instead."); // eslint-disable-line no-console
  } finally {
    await installPyodideDeps();
    console.log("Successfully installed all required Python packages in Pyodide"); // eslint-disable-line no-console
  }
}

async function installPyodideDeps() {
  const root = path.join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const pyodide = await loadPyodide({ indexURL: path.join(root, "node_modules", "pyodide") });
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  const requirementsPath = path.join(root, "generator", "requirements.txt");
  const requirementsText = fs.readFileSync(requirementsPath, "utf-8");
  const requirementsArray = requirementsText.split("\n").filter((line) => line.trim() !== "");
  await micropip.install(requirementsArray);
}

main();
