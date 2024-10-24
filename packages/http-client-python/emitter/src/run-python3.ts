// This script wraps logic in @azure-tools/extension to resolve
// the path to Python 3 so that a Python script file can be run
// from an npm script in package.json.  It uses the same Python 3
// path resolution algorithm as AutoRest so that the behavior
// is fully consistent (and also supports AUTOREST_PYTHON_EXE).
//
// Invoke it like so: "tsx run-python3.ts script.py"

import cp from "child_process";
import { patchPythonPath } from "./system-requirements.js";

export async function runPython3(...args: string[]) {
  const command = await patchPythonPath(["python", ...args], {
    version: ">=3.8",
    environmentVariable: "AUTOREST_PYTHON_EXE",
  });
  cp.exec(command.join(" "), 
  (error: cp.ExecException | null, stdout: string, stderr: string) => {
    if (error) {
      console.error(`Error: ${error.message}`); // eslint-disable-line no-console
      console.error(`stderr: ${stderr}`); // eslint-disable-line no-console
      process.exit(1);
    }
    console.log(`stdout: ${stdout}`); // eslint-disable-line no-console
  });
}
