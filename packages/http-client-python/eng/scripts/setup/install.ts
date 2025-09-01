import cp from "child_process";
import { patchPythonPath } from "./system-requirements.js";

async function main() {
  let pythonCommand: string[];
  
  try {
    // First try to resolve Python path
    pythonCommand = await patchPythonPath(["python", "./eng/scripts/setup/install.py"], {
      version: ">=3.8",
      environmentVariable: "AUTOREST_PYTHON_EXE",
    });
  } catch (error) {
    // Python not found - use Pyodide
    console.log("No Python found on your local environment. We will use Pyodide instead."); // eslint-disable-line no-console
    return;
  }

  try {
    // Python found, now try to run the installation script
    cp.execSync(pythonCommand.join(" "), {
      stdio: [0, 1, 2],
    });
    console.log("Found Python on your local environment and created a venv with all requirements."); // eslint-disable-line no-console
  } catch (error: any) {
    // Check the exit code to determine the type of error
    if (error.status === 2) {
      // Exit code 2: Python/pip not adequate - use Pyodide
      console.log("No Python found on your local environment. We will use Pyodide instead."); // eslint-disable-line no-console
    } else {
      // Exit code 1 or other: Python and pip were found but installation failed - fail the npm install
      console.error("Python and package manager found but installation failed."); // eslint-disable-line no-console
      process.exit(1);
    }
  }
}

main();
