// Node-only execution path for the Python emitter.
//
// All direct usage of Node built-ins (`fs`, `os`, `path`, `url`, `child_process`)
// lives here so that the emitter entry can be bundled for the browser. A sibling
// `node-runner.browser.ts` stub is swapped in via the `"browser"` field in
// `package.json` when bundling with `platform: "browser"`.

import { EmitContext, NoTarget } from "@typespec/compiler";
import { execSync } from "child_process";
import fs from "fs";
import os from "os";
import path, { dirname } from "path";
import { loadPyodide, PyodideInterface } from "pyodide";
import { fileURLToPath } from "url";
import { blackExcludeDirs, PYGEN_WHEEL_FILENAME } from "./constants.js";
import { saveCodeModelAsYaml } from "./external-process.js";
import { PythonEmitterOptions, reportDiagnostic } from "./lib.js";
import { runPython3 } from "./run-python3.js";

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
    .map(([key, value]) => `--${key}=${value}`)
    .join(" ");
  const command = `${venvPath} ${root}/eng/scripts/setup/run_tsp.py ${commandFlags}`;
  execSync(command);

  const excludePattern = blackExcludeDirs.join("|");
  execSync(
    `${venvPath} -m black --line-length=120 --quiet --fast ${outputDir} --exclude "${excludePattern}"`,
  );
  await checkForPylintIssues(outputDir, excludePattern);
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

async function checkForPylintIssues(outputDir: string, excludePattern: string) {
  const excludeRegex = new RegExp(excludePattern);

  const shouldExcludePath = (filePath: string): boolean => {
    const relativePath = path.relative(outputDir, filePath);
    const normalizedPath = relativePath.replace(/\\/g, "/");
    return excludeRegex.test(normalizedPath);
  };

  const processFile = async (filePath: string) => {
    let fileContent = await fs.promises.readFile(filePath, "utf-8");
    const pylintDisables: string[] = [];
    const lineEnding = fileContent.includes("\r\n") && os.platform() === "win32" ? "\r\n" : "\n";
    const lines: string[] = fileContent.split(lineEnding);
    if (lines.length > 0) {
      if (!lines[0].includes("line-too-long") && lines.some((line) => line.length > 120)) {
        pylintDisables.push("line-too-long", "useless-suppression");
      }
      if (!lines[0].includes("too-many-lines") && lines.length > 1000) {
        pylintDisables.push("too-many-lines");
      }
      if (pylintDisables.length > 0) {
        fileContent = lines[0].includes("pylint: disable=")
          ? [lines[0] + "," + pylintDisables.join(",")].concat(lines.slice(1)).join(lineEnding)
          : `# pylint: disable=${pylintDisables.join(",")}${lineEnding}` + fileContent;
        await fs.promises.writeFile(filePath, fileContent);
      }
    }
  };

  const collectPythonFiles = async (dir: string): Promise<string[]> => {
    if (shouldExcludePath(dir)) {
      return [];
    }

    const entries = await fs.promises.readdir(dir, { withFileTypes: true });

    const promises = entries.map(async (entry) => {
      const filePath = path.join(dir, entry.name);

      if (shouldExcludePath(filePath)) {
        return [];
      }

      if (entry.isDirectory()) {
        return collectPythonFiles(filePath);
      } else if (entry.name.endsWith(".py")) {
        return [filePath];
      }
      return [];
    });

    const results = await Promise.all(promises);
    return results.flat();
  };

  // Collect all Python files first, then process in parallel
  const pythonFiles = await collectPythonFiles(outputDir);
  await Promise.all(pythonFiles.map(processFile));
}
