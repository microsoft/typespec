// This script wraps logic in @azure-tools/extension to resolve
// the path to Python 3 so that a Python script file can be run
// from an npm script in package.json.  It uses the same Python 3
// path resolution algorithm as AutoRest so that the behavior
// is fully consistent (and also supports AUTOREST_PYTHON_EXE).
//
// Invoke it like so: "node run-python3.cjs script.py"

const cp = require("child_process");
const extension = require("./system-requirements.cjs");

async function runPython3(scriptName, ...args) {
  const command = await extension.patchPythonPath(["python", scriptName, ...args], {
    version: ">=3.8",
    environmentVariable: "AUTOREST_PYTHON_EXE",
  });
  cp.execSync(command.join(" "), {
    stdio: [0, 1, 2],
  });
}

runPython3(...process.argv.slice(2)).catch((err) => {
  console.error(err.toString());
  process.exit(1);
});
