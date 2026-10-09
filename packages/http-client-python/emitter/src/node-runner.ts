// Node-only execution path for the Python emitter.
//
// All direct usage of Node built-ins (`fs`, `os`, `path`, `url`, `child_process`)
// lives here so that the emitter entry can be bundled for the browser. A sibling
// `node-runner.browser.ts` stub is swapped in via the `"browser"` field in
// `package.json` when bundling with `platform: "browser"`.

import type { EmitContext } from "@typespec/compiler";
import { NoTarget } from "@typespec/compiler";
import { execSync } from "child_process";
import fs from "fs";
import path, { dirname } from "path";
import type { PyodideInterface } from "pyodide";
import { loadPyodide } from "pyodide";
import { fileURLToPath } from "url";
import { PYGEN_WHEEL_FILENAME } from "./constants.js";
import { saveCodeModelAsYaml } from "./external-process.js";
import type { PythonEmitterOptions } from "./lib.js";
import { reportDiagnostic } from "./lib.js";
import { runPython3 } from "./run-python3.js";
import { quoteShellArg } from "./utils.js";

export interface RunNodeEmitArgs {
  context: EmitContext<PythonEmitterOptions>;
  parsedYamlMap: Record<string, any>;
  commandArgs: Record<string, string>;
  resolvedOptions: PythonEmitterOptions;
  runPyodideGeneration: (
    pyodide: PyodideInterface,
    outputFolder: string,
    yamlFile: string,
    commandArgs: Record<string, string>,
  ) => Promise<void>;
}

export async function runNodeEmit({
  context,
  parsedYamlMap,
  commandArgs,
  resolvedOptions,
  runPyodideGeneration,
}: RunNodeEmitArgs): Promise<void> {
  const program = context.program;
  const outputDir = context.emitterOutputDir;
  const root = path.join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const yamlPath = await saveCodeModelAsYaml("python-yaml-path", parsedYamlMap);

  if (program.compilerOptions.noEmit || program.hasError()) {
    return;
  }

  // If emit-yaml-only mode, just copy YAML to output dir for batch processing
  if (resolvedOptions["emit-yaml-only"]) {
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    // Copy YAML to output dir with command args embedded
    // Use unique filename to avoid conflicts when multiple specs share output dir
    const configId = path.basename(yamlPath, ".yaml");
    const batchConfig = { yamlPath, commandArgs, outputDir };
    fs.writeFileSync(
      path.join(outputDir, `.tsp-codegen-${configId}.json`),
      JSON.stringify(batchConfig, null, 2),
    );
    return;
  }

  // if not using pyodide and there's no venv, we try to create venv
  if (!resolvedOptions["use-pyodide"] && !fs.existsSync(path.join(root, "venv"))) {
    try {
      await runPython3(path.join(root, "/eng/scripts/setup/install.py"));
      await runPython3(path.join(root, "/eng/scripts/setup/prepare.py"));
    } catch {
      // if the python env is not ready, we use pyodide instead
      resolvedOptions["use-pyodide"] = true;
    }
  }

  if (resolvedOptions["use-pyodide"]) {
    // here we run with pyodide
    const pyodide = await setupPyodideCall(root);
    // create the output folder if not exists
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    // mount output folder to pyodide
    pyodide.FS.mkdirTree("/output");
    pyodide.FS.mount(pyodide.FS.filesystems.NODEFS, { root: outputDir }, "/output");
    // mount yaml file to pyodide
    pyodide.FS.mkdirTree("/yaml");
    pyodide.FS.mount(pyodide.FS.filesystems.NODEFS, { root: path.dirname(yamlPath) }, "/yaml");
    await runPyodideGeneration(pyodide, "/output", `/yaml/${path.basename(yamlPath)}`, commandArgs);
    return;
  }

  // here we run with native python
  let venvPath = path.join(root, "venv");
  if (fs.existsSync(path.join(venvPath, "bin"))) {
    venvPath = path.join(venvPath, "bin", "python");
  } else if (fs.existsSync(path.join(venvPath, "Scripts"))) {
    venvPath = path.join(venvPath, "Scripts", "python.exe");
  } else {
    reportDiagnostic(program, {
      code: "pyodide-flag-conflict",
      target: NoTarget,
    });
    return;
  }
  commandArgs["output-folder"] = outputDir;
  commandArgs["tsp-file"] = yamlPath;
  const commandFlags = Object.entries(commandArgs)
    .map(([key, value]) => `--${key}=${quoteShellArg(String(value))}`)
    .join(" ");
  const command = `${quoteShellArg(venvPath)} ${quoteShellArg(path.join(root, "eng", "scripts", "setup", "run_tsp.py"))} ${commandFlags}`;
  execSync(command);
}

async function setupPyodideCall(root: string): Promise<PyodideInterface> {
  const pyodide = await loadPyodide({
    indexURL: path.dirname(fileURLToPath(import.meta.resolve("pyodide"))),
  });
  const micropipLockPath = path.join(root, "micropip.lock");
  while (true) {
    if (fs.existsSync(micropipLockPath)) {
      try {
        const stats = fs.statSync(micropipLockPath);
        const now = new Date().getTime();
        const lockAge = (now - stats.mtime.getTime()) / 1000;
        if (lockAge > 300) {
          fs.unlinkSync(micropipLockPath);
        }
      } catch {
        // ignore
      }
    }
    try {
      const fd = fs.openSync(micropipLockPath, "wx");
      // mount generator to pyodide
      pyodide.FS.mkdirTree("/generator");
      pyodide.FS.mount(
        pyodide.FS.filesystems.NODEFS,
        { root: path.join(root, "generator") },
        "/generator",
      );
      await pyodide.loadPackage("micropip");
      const micropip = pyodide.pyimport("micropip");
      await micropip.install(`emfs:/generator/dist/${PYGEN_WHEEL_FILENAME}`);
      fs.closeSync(fd);
      fs.unlinkSync(micropipLockPath);
      break;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return pyodide;
}
