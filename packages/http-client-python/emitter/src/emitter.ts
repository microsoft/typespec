import {
  createSdkContext,
  SdkContext,
  SdkHttpOperation,
  SdkServiceOperation,
} from "@azure-tools/typespec-client-generator-core";
import { EmitContext, NoTarget } from "@typespec/compiler";
import { execSync } from "child_process";
import fs from "fs";
import path, { dirname } from "path";
import { loadPyodide } from "pyodide";
import { fileURLToPath } from "url";
import { emitCodeModel } from "./code-model.js";
import { saveCodeModelAsYaml } from "./external-process.js";
import { PythonEmitterOptions, PythonSdkContext, reportDiagnostic } from "./lib.js";
import { runPython3 } from "./run-python3.js";
import { removeUnderscoresFromNamespace } from "./utils.js";

export function getModelsMode(context: SdkContext): "dpg" | "none" {
  const specifiedModelsMode = context.emitContext.options["models-mode"];
  if (specifiedModelsMode) {
    const modelModes = ["dpg", "none"];
    if (modelModes.includes(specifiedModelsMode)) {
      return specifiedModelsMode;
    }
    throw new Error(
      `Need to specify models mode with the following values: ${modelModes.join(", ")}`,
    );
  }
  return "dpg";
}

function addDefaultOptions(sdkContext: SdkContext) {
  const defaultOptions = {
    "package-version": "1.0.0b1",
    "generate-packaging-files": true,
    flavor: undefined,
  };
  sdkContext.emitContext.options = {
    ...defaultOptions,
    ...sdkContext.emitContext.options,
  };
  const options = sdkContext.emitContext.options;
  options["models-mode"] = getModelsMode(sdkContext);
  if (options["generate-packaging-files"]) {
    options["package-mode"] = sdkContext.arm ? "azure-mgmt" : "azure-dataplane";
  }
  if (!options["package-name"]) {
    options["package-name"] = removeUnderscoresFromNamespace(
      (sdkContext.sdkPackage.rootNamespace ?? "").toLowerCase(),
    ).replace(/\./g, "-");
  }
  if (options.flavor !== "azure") {
    // if they pass in a flavor other than azure, we want to ignore the value
    options.flavor = undefined;
  }
  if (!options.flavor && sdkContext.emitContext.emitterOutputDir.includes("azure")) {
    options.flavor = "azure";
  }
}

async function createPythonSdkContext<TServiceOperation extends SdkServiceOperation>(
  context: EmitContext<PythonEmitterOptions>,
): Promise<PythonSdkContext<TServiceOperation>> {
  return {
    ...(await createSdkContext<PythonEmitterOptions, TServiceOperation>(
      context,
      "@typespec/http-client-python",
      {
        additionalDecorators: ["TypeSpec\\.@encodedName"],
      },
    )),
    __endpointPathParameters: [],
  };
}

export async function $onEmit(context: EmitContext<PythonEmitterOptions>) {
  const program = context.program;
  const sdkContext = await createPythonSdkContext<SdkHttpOperation>(context);
  const root = path.join(dirname(fileURLToPath(import.meta.url)), "..", "..");
  const outputDir = context.emitterOutputDir;
  const yamlMap = emitCodeModel(sdkContext);
  if (yamlMap.clients.length === 0) {
    reportDiagnostic(program, {
      code: "no-valid-client",
      target: NoTarget,
    });
    return;
  }
  const yamlPath = await saveCodeModelAsYaml("python-yaml-path", yamlMap);
  addDefaultOptions(sdkContext);
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
  if (
    resolvedOptions["package-pprint-name"] !== undefined &&
    !resolvedOptions["package-pprint-name"].startsWith('"')
  ) {
    resolvedOptions["package-pprint-name"] = `${resolvedOptions["package-pprint-name"]}`;
  }

  for (const [key, value] of Object.entries(resolvedOptions)) {
    commandArgs[key] = value;
  }
  if (sdkContext.arm === true) {
    commandArgs["azure-arm"] = "true";
  }
  if (resolvedOptions.flavor === "azure") {
    commandArgs["emit-cross-language-definition-file"] = "true";
  }
  commandArgs["from-typespec"] = "true";

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
            warnings.simplefilter("ignore", SyntaxWarning) # bc of m2r2 dep issues
            from pygen import m2r, preprocess, codegen, black
          m2r.M2R(output_folder=outputFolder, cadl_file=yamlFile, **commandArgs).process()
          preprocess.PreProcessPlugin(output_folder=outputFolder, cadl_file=yamlFile, **commandArgs).process()
          codegen.CodeGenerator(output_folder=outputFolder, cadl_file=yamlFile, **commandArgs).process()
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
        throw new Error("Virtual environment doesn't exist.");
      }
      commandArgs["output-folder"] = outputDir;
      commandArgs["cadl-file"] = yamlPath;
      const commandFlags = Object.entries(commandArgs)
        .map(([key, value]) => `--${key}=${value}`)
        .join(" ");
      const command = `${venvPath} ${root}/eng/scripts/setup/run_tsp.py ${commandFlags}`;
      execSync(command);
    }
  }
}

async function setupPyodideCall(root: string) {
  const pyodide = await loadPyodide({
    indexURL: path.dirname(fileURLToPath(import.meta.resolve("pyodide"))),
  });
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
  return pyodide;
}
