import path, { dirname } from "path";
import { loadPyodide } from "pyodide";
import { fileURLToPath } from "url";
import { runPython3 } from "./run-python3.js";

async function installPythonDeps() {
  try {
    await runPython3("./eng/scripts/setup/install.py");
  } catch (error) {
    console.log("No Python installation found. Skipping Python dependencies installation."); // eslint-disable-line no-console
  }
}

async function installPyodideDeps() {
  const root = path.join(dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
  const pyodide = await loadPyodide({ indexURL: path.join(root, "node_modules", "pyodide") });
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install([
    "black",
    "click",
    "docutils==0.21.2",
    "Jinja2==3.1.4",
    "m2r2==0.3.3.post2",
    "MarkupSafe",
    "pathspec",
    "platformdirs",
    "pyyaml",
    "tomli",
    "setuptools",
  ]);
}

installPythonDeps()
  .then(() => console.log("Successfully installed all required Python packages")) // eslint-disable-line no-console
  .catch((error) => console.error(`Installation failed: ${error.message}`)); // eslint-disable-line no-console

// installPyodideDeps()
//   .then(() => console.log("Successfully installed all required Python packages in Pyodide")) // eslint-disable-line no-console
//   .catch((error) => console.error(`Installation in Pyodide failed: ${error.message}`)); // eslint-disable-line no-console
