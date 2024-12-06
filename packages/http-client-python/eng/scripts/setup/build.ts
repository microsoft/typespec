import { exec } from "child_process";

// Define the command you want to run
const command =
  "tsx ./eng/scripts/setup/run-python3.ts ./eng/scripts/setup/build_pygen_wheel.py && rimraf ./venv_build_wheel";

// Execute the command
exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing command: ${error.message}`); // eslint-disable-line no-console
    return;
  }
  console.log(`Command output:\n${stdout}`); // eslint-disable-line no-console
});
