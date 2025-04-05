import { createSdkContext } from "@azure-tools/typespec-client-generator-core";
import { EmitContext, NoTarget } from "@typespec/compiler";
import { execSync } from "child_process";
import fs from "fs";
import path, { dirname } from "path";
import process from "process";
import { loadPyodide } from "pyodide";
import { fileURLToPath } from "url";
import { emitCodeModel } from "./code-model.js";
import { saveCodeModelAsYaml } from "./external-process.js";
import { PythonEmitterOptions, PythonSdkContext, reportDiagnostic } from "./lib.js";
import { runPython3 } from "./run-python3.js";
import { disableGenerationMap, simpleTypesMap, typesMap } from "./types.js";
import { getRootNamespace, md2Rst } from "./utils.js";

function addDefaultOptions(sdkContext: PythonSdkContext) {
  const defaultOptions = {
    "package-version": "1.0.0b1",
    "generate-packaging-files": true,
  };
  sdkContext.emitContext.options = {
    ...defaultOptions,
    ...sdkContext.emitContext.options,
  };
  const options = sdkContext.emitContext.options;
  if (!options["package-name"]) {
    const namespace = getRootNamespace(sdkContext);
    const packageName = namespace.replace(/\./g, "-");
    reportDiagnostic(sdkContext.program, {
      code: "no-package-name",
      target: NoTarget,
      format: { namespace, packageName },
    });
    options["package-name"] = packageName;
  }
  if ((options as any).flavor !== "azure") {
    // if they pass in a flavor other than azure, we want to ignore the value
    (options as any).flavor = undefined;
  }
  if (
    (options as any).flavor === undefined &&
    sdkContext.emitContext.emitterOutputDir.includes("azure")
  ) {
    (options as any).flavor = "azure";
  }

  if (
    options["package-pprint-name"] !== undefined &&
    !options["package-pprint-name"].startsWith('"')
  ) {
    options["package-pprint-name"] = options["use-pyodide"]
      ? `${options["package-pprint-name"]}`
      : `"${options["package-pprint-name"]}"`;
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

function cleanAllCache() {
  typesMap.clear();
  simpleTypesMap.clear();
  disableGenerationMap.clear();
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
  // clean all cache to make sure emitter could work in watch mode
  cleanAllCache();

  const program = context.program;
  const sdkContext = await createPythonSdkContext(context);
  const root = path.join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const outputDir = context.emitterOutputDir;
  addDefaultOptions(sdkContext);
  const yamlMap = emitCodeModel(sdkContext);
  if (yamlMap.clients.length === 0) {
    reportDiagnostic(program, {
      code: "no-valid-client",
      target: NoTarget,
    });
    return;
  }

  const parsedYamlMap = walkThroughNodes(yamlMap);

  const yamlPath = await saveCodeModelAsYaml("python-yaml-path", parsedYamlMap);
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
  }
  if (sdkContext.arm === true) {
    commandArgs["azure-arm"] = "true";
  }
  if ((resolvedOptions as any).flavor === "azure") {
    commandArgs["emit-cross-language-definition-file"] = "true";
  }
  commandArgs["from-typespec"] = "true";
  commandArgs["models-mode"] = (resolvedOptions as any)["models-mode"] ?? "dpg";

  if (!program.compilerOptions.noEmit && !program.hasError()) {
    // if not using pyodide and there's no venv, we try to create venv
    if (!resolvedOptions["use-pyodide"] && !fs.existsSync(path.join(root, "venv"))) {
      try {
        await runPython3(path.join(root, "/eng/scripts/setup/install.py"));
        await runPython3(path.join(root, "/eng/scripts/setup/prepare.py"));
      } catch (error) {
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
      const globals = pyodide.toPy({
        outputFolder: "/output",
        yamlFile: `/yaml/${path.basename(yamlPath)}`,
        commandArgs,
      });
      const pythonCode = `
          async def main():
            import warnings
            with warnings.catch_warnings():
              from pygen import preprocess, codegen, black
            preprocess.PreProcessPlugin(output_folder=outputFolder, tsp_file=yamlFile, **commandArgs).process()
            codegen.CodeGenerator(output_folder=outputFolder, tsp_file=yamlFile, **commandArgs).process()
            black.BlackScriptPlugin(output_folder=outputFolder, **commandArgs).process()
      
          await main()`;
      await pyodide.runPythonAsync(pythonCode, { globals });
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
      execSync(command, { stdio: [process.stdin, process.stdout] });
    }
  }
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
      } catch (err) {
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
      await micropip.install("emfs:/generator/dist/pygen-0.1.0-py3-none-any.whl");
      fs.closeSync(fd);
      fs.unlinkSync(micropipLockPath);
      break;
    } catch (err) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
  return pyodide;
}
