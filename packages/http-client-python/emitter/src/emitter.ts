import { createSdkContext } from "@azure-tools/typespec-client-generator-core";
import { EmitContext, emitFile, joinPaths, NoTarget } from "@typespec/compiler";
import jsyaml from "js-yaml";
import pkgJson from "../../package.json" with { type: "json" };
import { emitCodeModel } from "./code-model.js";
import {
  BLOB_STORAGE_BASE_URL,
  PACKAGE_NAME,
  PYGEN_WHEEL_FILENAME,
  PYODIDE_VERSION,
} from "./constants.js";
import { PythonEmitterOptions, PythonSdkContext, reportDiagnostic } from "./lib.js";
import { runNodeEmit } from "./node-runner.js";
import { loadPyodide, PyodideInterface } from "./pyodide-loader.js";
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
  if (resolvedOptions["keep-pyproject-fields"]) {
    // Flatten the object of enabled fields into a comma-separated list for the generator.
    const enabledFields = Object.entries(resolvedOptions["keep-pyproject-fields"])
      .filter(([, value]) => value === true)
      .map(([key]) => key);
    commandArgs["keep-pyproject-fields"] = enabledFields.join(",");
    resolvedOptions["keep-pyproject-fields"] = undefined;
  }

  for (const [key, value] of Object.entries(resolvedOptions)) {
    if (key === "license" || key === "keep-pyproject-fields") continue; // skip license + keep-pyproject-fields since it is passed in codeModel
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
    const pyodide = await browserPyodidePromise;

    if (!pyodide) {
      reportDiagnostic(program, {
        code: "browser-runtime-load-failed",
        target: NoTarget,
        format: { details: "" },
      });
      return;
    }

    const yamlFilePath = "/yaml/python-yaml-path.yaml";
    pyodide.FS.mkdirTree("/yaml");
    pyodide.FS.mkdirTree("/output");
    clearMemfsDirectory(pyodide, "/output");
    pyodide.FS.writeFile(yamlFilePath, jsyaml.dump(parsedYamlMap));

    await runPyodideGeneration(pyodide, "/output", yamlFilePath, commandArgs);
    await copyPyodideOutputToHost(context, pyodide, "/output");
  } else {
    await runNodeEmit({
      context,
      parsedYamlMap,
      commandArgs,
      resolvedOptions,
      runPyodideGeneration,
    });
  }
}

const browserPyodidePromise: Promise<PyodideInterface> | null =
  typeof window !== "undefined" ? setupPyodideCallBrowser() : null;

function clearMemfsDirectory(pyodide: PyodideInterface, dir: string): void {
  const entries: string[] = pyodide.FS.readdir(dir).filter(
    (entry: string) => entry !== "." && entry !== "..",
  );
  for (const entry of entries) {
    const fullPath = `${dir}/${entry}`;
    const stats = pyodide.FS.stat(fullPath);
    if (pyodide.FS.isDir(stats.mode)) {
      clearMemfsDirectory(pyodide, fullPath);
      pyodide.FS.rmdir(fullPath);
    } else {
      pyodide.FS.unlink(fullPath);
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
