import { runPython3 } from "./run-python3.js";

async function preparePythonDeps() {
  await runPython3("./eng/scripts/setup/prepare.py");
}

preparePythonDeps()
  .then(() => console.log("Successfully prepared all required Python packages")) // eslint-disable-line no-console
  .catch((error) => console.log(`Preparation failed: ${error.message}`)); // eslint-disable-line no-console
