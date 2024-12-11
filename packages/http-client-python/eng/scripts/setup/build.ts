import { exec } from "child_process";
import { runPython3 } from "./run-python3.js";

async function main() {
  await runPython3("./eng/scripts/setup/build_pygen_wheel.py");
  // remove the venv_build_wheel directory
  exec("rimraf ./venv_build_wheel", (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing command: ${error.message}`); // eslint-disable-line no-console
      return;
    }
    console.log(`Command output:\n${stdout}`); // eslint-disable-line no-console
  });
}

main();
