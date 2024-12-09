import { runPython3 } from "./run-python3.js";

async function preparePythonDeps() {
  try {
    await runPython3("./eng/scripts/setup/prepare.py");
  } catch (error) {
    console.log("No Python installation found. Skipping Python dependencies preparation."); // eslint-disable-line no-console
  }
}

preparePythonDeps()
  .then(() => console.log("Successfully prepared all required Python packages")) // eslint-disable-line no-console
  .catch((error) => console.error(`Preparation failed: ${error.message}`)); // eslint-disable-line no-console
