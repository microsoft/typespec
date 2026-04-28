import { createSdkContext } from "@azure-tools/typespec-client-generator-core";
import { EmitContext, emitFile, joinPaths, NoTarget } from "@typespec/compiler";
import { execSync } from "child_process";
import fs from "fs";
import jsyaml from "js-yaml";
import os from "os";
import path, { dirname } from "path";
import { loadPyodide, PyodideInterface } from "pyodide";
import { fileURLToPath } from "url";
import pkgJson from "../../package.json" with { type: "json" };
import { emitCodeModel } from "./code-model.js";
import {
  blackExcludeDirs,
  BLOB_STORAGE_BASE_URL,
  PACKAGE_NAME,
  PYGEN_WHEEL_FILENAME,
  PYODIDE_VERSION,
} from "./constants.js";
import { saveCodeModelAsYaml } from "./external-process.js";
import { PythonEmitterOptions, PythonSdkContext, reportDiagnostic } from "./lib.js";
import { runPython3 } from "./run-python3.js";
import { getRootNamespace, md2Rst } from "./utils.js";

function getBrowserPygenWheelUrl(): string {
  return `${BLOB_STORAGE_BASE_URL}/${PACKAGE_NAME}/${pkgJson.version}/generator/dist/${PYGEN_WHEEL_FILENAME}`;
}

function addDefaultOptions(sdkContext: PythonSdkContext) {
  const defaultOptions = {
    "package-version": "1.0.0b1",
    "generate-packaging-files": true,
    "validate-versioning": true,
    "clear-output-folder": false,
  };
  sdkContext.emitContext.options = {
    ...defaultOptions,
    ...sdkContext.emitContext.options,
  };
  const options = sdkContext.emitContext.options;
  if (!options["package-name"]) {
    const namespace = getRootNamespace(sdkContext);
    const packageName = namespace.replace(/\./g, "-");
    options["package-name"] = packageName;
  }
  // Set flavor based on namespace or passed option
  if (getRootNamespace(sdkContext).toLowerCase().includes("azure")) {
    (options as any).flavor = "azure";
  } else if ((options as any).flavor !== "azure") {
    // Explicitly set unbranded flavor when not azure
    (options as any).flavor = "unbranded";
  }

  if (
    options["package-pprint-name"] !== undefined &&
    !options["package-pprint-name"].startsWith('"')
  ) {
    // Only add quotes for shell compatibility when NOT using emit-yaml-only mode
    // (emit-yaml-only passes options via JSON config files, not shell)
    const needsShellQuoting = !options["use-pyodide"] && !options["emit-yaml-only"];
    options["package-pprint-name"] = needsShellQuoting
      ? `"${options["package-pprint-name"]}"`
      : `${options["package-pprint-name"]}`;
  }
}

async function createPythonSdkContext(
  context: EmitContext<PythonEmitterOptions>,
): Promise<PythonSdkContext> {
  const sdkContext = await createSdkContext<PythonEmitterOptions>(
    context,
    "@azure-tools/typespec-python",
  );
  context.program.reportDiagnostics(sdkContext.diagnostics);
  return {
    ...sdkContext,
    __endpointPathParameters: [],
    __typesMap: new Map(),
    __simpleTypesMap: new Map(),
    __disableGenerationMap: new Set(),
  };
}

function walkThroughNodes(yamlMap: Record<string, any>): Record<string, any> {
  const stack = [yamlMap];
  const seen = new WeakSet();

  while (stack.length > 0) {
    const current = stack.pop();

    if (seen.has(current!)) {
      continue;
    }
    if (current !== undefined && current !== null) {
      seen.add(current);
    }

    if (Array.isArray(current)) {
      for (let i = 0; i < current.length; i++) {
        if (current[i] !== undefined && typeof current[i] === "object") {
          stack.push(current[i]);
        }
      }
    } else {
      for (const key in current) {
        if (key === "description" || key === "summary") {
          if (current[key] !== undefined) {
            current[key] = md2Rst(current[key]);
          }
        } else if (Array.isArray(current[key])) {
          stack.push(current[key]);
        } else if (current[key] !== undefined && typeof current[key] === "object") {
          stack.push(current[key]);
        }
      }
    }
  }

  return yamlMap;
}

const pyodideGenerationCode = `
async def main():
  import warnings
  with warnings.catch_warnings():
    from pygen import preprocess, codegen, black
  preprocess.PreProcessPlugin(output_folder=outputFolder, tsp_file=yamlFile, **commandArgs).process()
  codegen.CodeGenerator(output_folder=outputFolder, tsp_file=yamlFile, **commandArgs).process()
  black.BlackScriptPlugin(output_folder=outputFolder, **commandArgs).process()

await main()`;

async function runPyodideGeneration(
  pyodide: PyodideInterface,
  outputFolder: string,
  yamlFile: string,
  commandArgs: Record<string, string>,
) {
  const globals = pyodide.toPy({
    outputFolder,
    yamlFile,
    commandArgs,
  });

  await pyodide.runPythonAsync(pyodideGenerationCode, { globals });
}

async function copyPyodideOutputToHost(
  context: EmitContext<PythonEmitterOptions>,
  pyodide: PyodideInterface,
  memfsDir: string,
  relativeDir: string = "",
) {
  const entries = pyodide.FS.readdir(memfsDir).filter(
    (entry: string) => entry !== "." && entry !== "..",
  );

  for (const entry of entries) {
    const memfsPath = `${memfsDir}/${entry}`;
    const relativePath = relativeDir ? `${relativeDir}/${entry}` : entry;
    const stats = pyodide.FS.stat(memfsPath);

    if (pyodide.FS.isDir(stats.mode)) {
      await copyPyodideOutputToHost(context, pyodide, memfsPath, relativePath);
      continue;
    }

    const content = pyodide.FS.readFile(memfsPath, { encoding: "utf8" });
    await emitFile(context.program, {
      path: joinPaths(context.emitterOutputDir, relativePath),
      content,
    });
  }
}

export async function $onEmit(context: EmitContext<PythonEmitterOptions>) {
  try {
    await onEmitMain(context);
  } catch (error: any) {
    const errStackStart =
      "========================================= error stack start ================================================";
    const errStackEnd =
      "========================================= error stack end ================================================";
    const errStack = error.stack ? `\n${errStackStart}\n${error.stack}\n${errStackEnd}` : "";
    reportDiagnostic(context.program, {
      code: "unknown-error",
      target: NoTarget,
      format: { stack: errStack },
    });
  }
}

async function onEmitMain(context: EmitContext<PythonEmitterOptions>) {
  const program = context.program;
  const sdkContext = await createPythonSdkContext(context);

  const outputDir = context.emitterOutputDir;
  addDefaultOptions(sdkContext);
  const yamlMap = emitCodeModel(sdkContext);
  const parsedYamlMap = walkThroughNodes(yamlMap);

  // Python emitter requires an SDK client in the TypeSpec
  if (sdkContext.sdkPackage.clients.length === 0) {
    reportDiagnostic(program, {
      code: "no-sdk-clients",
      target: NoTarget,
    });
    return;
  }

  const resolvedOptions = sdkContext.emitContext.options;
  const commandArgs: Record<string, string> = {};
  if (resolvedOptions["packaging-files-config"]) {
    const keyValuePairs = Object.entries(resolvedOptions["packaging-files-config"]).map(
      ([key, value]) => {
        return `${key}:${value}`;
      },
    );
    commandArgs["packaging-files-config"] = keyValuePairs.join("|");
    resolvedOptions["packaging-files-config"] = undefined;
  }

  for (const [key, value] of Object.entries(resolvedOptions)) {
    if (key === "license") continue; // skip license since it is passed in codeModel
    commandArgs[key] = value;
  }
  if (resolvedOptions["generate-packaging-files"]) {
    commandArgs["package-mode"] = sdkContext.arm ? "azure-mgmt" : "azure-dataplane";
    commandArgs["keep-setup-py"] = resolvedOptions["keep-setup-py"] === true ? "true" : "false";
  }
  if (sdkContext.arm === true) {
    commandArgs["azure-arm"] = "true";
  }
  commandArgs["from-typespec"] = "true";
  commandArgs["models-mode"] = (resolvedOptions as any)["models-mode"] ?? "dpg";

  if (typeof window !== "undefined") {
    // Running in browser with Pyodide - fileURLToPath and other filesystem operations are browser-incompatible
    const pyodide = await setupPyodideCallBrowser();

    const yamlFilePath = "/yaml/python-yaml-path.yaml";
    pyodide.FS.mkdirTree("/yaml");
    pyodide.FS.mkdirTree("/output");
    pyodide.FS.writeFile(yamlFilePath, jsyaml.dump(parsedYamlMap));

    await runPyodideGeneration(pyodide, "/output", yamlFilePath, commandArgs);
    await copyPyodideOutputToHost(context, pyodide, "/output");
  } else {
    const root = path.join(dirname(fileURLToPath(import.meta.url)), "..", "..");
    const yamlPath = await saveCodeModelAsYaml("python-yaml-path", parsedYamlMap);

    if (!program.compilerOptions.noEmit && !program.hasError()) {
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
        await runPyodideGeneration(
          pyodide,
          "/output",
          `/yaml/${path.basename(yamlPath)}`,
          commandArgs,
        );
      } else {
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
    }
  }
}

async function setupPyodideCallBrowser() {
  const pyodide = await loadPyodide({
    indexURL: `https://cdn.jsdelivr.net/pyodide/v${PYODIDE_VERSION}/full/`,
  });

  // use default MEMFS for browser, since NODEFS is not supported
  pyodide.FS.mkdirTree("/generator");
  await pyodide.loadPackage("micropip");
  const micropip = pyodide.pyimport("micropip");
  await micropip.install(getBrowserPygenWheelUrl());

  return pyodide;
}

async function setupPyodideCall(root: string) {
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
