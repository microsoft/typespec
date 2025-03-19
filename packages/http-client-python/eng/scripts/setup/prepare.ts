import { runPython3 } from "./run-python3.js";

async function main() {
  try {
    await runPython3("./eng/scripts/setup/prepare.py");
  } catch (error) {
    console.log("No Python found on your local environment. We will use Pyodide instead."); // eslint-disable-line no-console
  }
}

main();
