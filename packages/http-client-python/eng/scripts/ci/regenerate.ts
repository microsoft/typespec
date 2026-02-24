/* eslint-disable no-console */
import chalk from "chalk";
import { execFile } from "child_process";
import { promises, rmSync } from "fs";
import { join, resolve } from "path";
import { fileURLToPath } from "url";
import { parseArgs, promisify } from "util";
import {
  BASE_AZURE_EMITTER_OPTIONS,
  BASE_EMITTER_OPTIONS,
  buildOptions,
  regenerate,
  toPosix,
  type RegenerateConfig,
  type RegenerateFlags,
  type RegenerateFlagsInput,
  type TspCommand,
} from "./regenerate-common.js";

// PARSE INPUT ARGUMENTS

const argv = parseArgs({
  args: process.argv.slice(2),
  options: {
    flavor: { type: "string" },
    name: { type: "string" },
    debug: { type: "boolean" },
    pluginDir: { type: "string" },
    emitterName: { type: "string" },
    generatedFolder: { type: "string" },
    pyodide: { type: "boolean" },
  },
});

// Get the directory of the current file
const PLUGIN_DIR = argv.values.pluginDir
  ? resolve(argv.values.pluginDir)
  : resolve(fileURLToPath(import.meta.url), "../../../../");
const AZURE_HTTP_SPECS = resolve(PLUGIN_DIR, "node_modules/@azure-tools/azure-http-specs/specs");
const HTTP_SPECS = resolve(PLUGIN_DIR, "node_modules/@typespec/http-specs/specs");
const GENERATED_FOLDER = argv.values.generatedFolder
  ? resolve(argv.values.generatedFolder)
  : resolve(PLUGIN_DIR, "generator");
const EMITTER_NAME = argv.values.emitterName || "@typespec/http-client-python";

const AZURE_EMITTER_OPTIONS: Record<string, Record<string, string> | Record<string, string>[]> = {
  ...BASE_AZURE_EMITTER_OPTIONS,
  "client/structure/client-operation-group": {
    "package-name": "client-structure-clientoperationgroup",
    namespace: "client.structure.clientoperationgroup",
  },
};

const EMITTER_OPTIONS: Record<string, Record<string, string> | Record<string, string>[]> = {
  ...BASE_EMITTER_OPTIONS,
  "type/array": {
    "package-name": "typetest-array",
    namespace: "typetest.array",
    "use-pyodide": "true",
  },
  "type/model/inheritance/recursive": {
    "package-name": "typetest-model-recursive",
    namespace: "typetest.model.recursive",
    "use-pyodide": "true",
  },
};

// Function to execute CLI commands asynchronously
async function executeCommand(tspCommand: TspCommand): Promise<void> {
  const cmd = tspCommand.command as string[];
  const execFileAsync = promisify(execFile);
  try {
    console.log(chalk.green(`start tsp ${cmd.join(" ")}`));
    await execFileAsync("tsp", cmd, { shell: true });
    console.log(chalk.green(`tsp ${cmd.join(" ")} succeeded`));
  } catch (err) {
    rmSync(tspCommand.outputDir, { recursive: true, force: true });
    console.error(chalk.red(`exec error: ${err}`));
    throw err;
  }
}

// create some files before regeneration. After regeneration, these files should be deleted and we will test it
// in test case
async function preprocess(flags: RegenerateFlagsInput): Promise<void> {
  if (flags.flavor === "azure") {
    // create folder if not exists
    const folderParts = [
      "test",
      "azure",
      "generated",
      "authentication-api-key",
      "authentication",
      "apikey",
      "_operations",
    ];
    await promises.mkdir(join(GENERATED_FOLDER, ...folderParts), { recursive: true });
    await promises.writeFile(
      join(GENERATED_FOLDER, ...folderParts, "to_be_deleted.py"),
      "# This file is to be deleted after regeneration",
    );
  }
}

function _getCmdList(spec: string, flags: RegenerateFlags): TspCommand[] {
  return buildOptions(spec, GENERATED_FOLDER, flags, config).map((po) => {
    const optionArgs = Object.entries(po.options).flatMap(([k, v]) => [
      "--option",
      `${EMITTER_NAME}.${k}="${v}"`,
    ]);
    return {
      outputDir: po.outputDir,
      command: ["compile", spec, "--emit", toPosix(PLUGIN_DIR), ...optionArgs],
    };
  });
}

const config: RegenerateConfig = {
  azureHttpSpecs: AZURE_HTTP_SPECS,
  httpSpecs: HTTP_SPECS,
  emitterOptions: EMITTER_OPTIONS,
  azureEmitterOptions: AZURE_EMITTER_OPTIONS,
  preprocess,
  getCmdList: _getCmdList,
  executeCommand,
};

const start = performance.now();
regenerate(argv.values, config)
  .then(() =>
    console.log(
      chalk.green(
        `Regeneration successful, time taken: ${Math.round((performance.now() - start) / 1000)} s`,
      ),
    ),
  )
  .catch((error) => console.error(chalk.red(`Regeneration failed: ${error.message}`)));
