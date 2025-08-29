import { runPython3 } from "./run-python3.js";

async function main() {
  try {
    await runPython3("./eng/scripts/setup/install.py");
    console.log("Found Python on your local environment and created a venv with all requirements."); // eslint-disable-line no-console
  } catch (error) {
    console.log(`Ran into the following error when setting up your local environment: ${error}`);
    console.log("No Python found on your local environment. We will use Pyodide instead."); // eslint-disable-line no-console
  }
}

main();
