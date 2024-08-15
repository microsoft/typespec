// This script wraps logic in @azure-tools/extension to resolve
// the path to Python 3 so that a Python script file can be run
// from an npm script in package.json.  It uses the same Python 3
// path resolution algorithm as AutoRest so that the behavior
// is fully consistent (and also supports AUTOREST_PYTHON_EXE).
//
// Invoke it like so: "node run-python3.cjs script.py"

import { execSync } from "child_process";
import { patchPythonPath } from "./system-requirements.ts";

async function runPython3(scriptName: string, ...args: string[]): Promise<void> {
  const command = await patchPythonPath(["python", scriptName, ...args], {
    version: ">=3.8",
    environmentVariable: "AUTOREST_PYTHON_EXE",
  });
  execSync(command.join(" "), {
    stdio: "inherit",
  });
}

runPython3(...process.argv.slice(2)).catch((err) => {
  console.error(err.toString());
  process.exit(1);
});
