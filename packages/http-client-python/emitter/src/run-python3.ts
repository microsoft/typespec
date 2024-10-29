// This script wraps logic in @azure-tools/extension to resolve
// the path to Python 3 so that a Python script file can be run
// from an npm script in package.json.  It uses the same Python 3
// path resolution algorithm as AutoRest so that the behavior
// is fully consistent (and also supports AUTOREST_PYTHON_EXE).
//
// Invoke it like so: "tsx run-python3.ts script.py"

import cp from "child_process";
import util from "util";
import { patchPythonPath } from "./system-requirements.js";

export async function runPython3(...args: string[]) {
  const command = await patchPythonPath(["python", ...args], {
    version: ">=3.8",
    environmentVariable: "AUTOREST_PYTHON_EXE",
  });
  const execPromise = util.promisify(cp.exec);
  try {
    const { stdout, stderr } = await execPromise(command.join(" "));
    console.log("Output:", stdout); // eslint-disable-line no-console
    if (stderr) {
      console.error("Error:", stderr); // eslint-disable-line no-console
    }
  } catch (error) {
    console.error("Execution error:", error); // eslint-disable-line no-console
  }
}
