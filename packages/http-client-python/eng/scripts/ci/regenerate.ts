/* eslint-disable no-console */
import chalk from "chalk";
import { execFile } from "child_process";
import { promises, rmSync } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { parseArgs, promisify } from "util";

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

interface TspCommand {
  outputDir: string;
  command: string[];
}

const AZURE_EMITTER_OPTIONS: Record<string, Record<string, string> | Record<string, string>[]> = {
  "azure/example/basic": {
    namespace: "specs.azure.example.basic",
  },
  "azure/client-generator-core/access": {
    namespace: "specs.azure.clientgenerator.core.access",
  },
  "azure/client-generator-core/usage": {
    namespace: "specs.azure.clientgenerator.core.usage",
  },
  "client/structure/default": {
    namespace: "client.structure.service",
  },
  "client/structure/multi-client": {
    "package-name": "client-structure-multiclient",
    namespace: "client.structure.multiclient",
  },
  "client/structure/renamed-operation": {
    "package-name": "client-structure-renamedoperation",
    namespace: "client.structure.renamedoperation",
  },
  "client/structure/two-operation-group": {
    "package-name": "client-structure-twooperationgroup",
    namespace: "client.structure.twooperationgroup",
  },
  "client/naming": {
    namespace: "client.naming",
  },
  "encode/duration": {
    namespace: "encode.duration",
  },
  "encode/numeric": {
    namespace: "encode.numeric",
  },
  "parameters/basic": {
    namespace: "parameters.basic",
  },
  "parameters/spread": {
    namespace: "parameters.spread",
  },
  "payload/content-negotiation": {
    namespace: "payload.contentnegotiation",
  },
  "payload/multipart": {
    namespace: "payload.multipart",
  },
  "serialization/encoded-name/json": {
    namespace: "serialization.encodedname.json",
  },
  "special-words": {
    namespace: "specialwords",
  },
};

const EMITTER_OPTIONS: Record<string, Record<string, string> | Record<string, string>[]> = {
  "resiliency/srv-driven/old.tsp": {
    "package-name": "resiliency-srv-driven1",
    namespace: "resiliency.srv.driven1",
    "package-mode": "azure-dataplane",
    "package-pprint-name": "ResiliencySrvDriven1",
  },
  "resiliency/srv-driven": {
    "package-name": "resiliency-srv-driven2",
    namespace: "resiliency.srv.driven2",
    "package-mode": "azure-dataplane",
    "package-pprint-name": "ResiliencySrvDriven2",
  },
  "authentication/http/custom": {
    "package-name": "authentication-http-custom",
    namespace: "authentication.http.custom",
    "package-pprint-name": "Authentication Http Custom",
  },
  "authentication/union": {
    "package-name": "authentication-union",
    namespace: "authentication.union",
  },
  "type/array": {
    "package-name": "typetest-array",
    namespace: "typetest.array",
    "use-pyodide": "true",
  },
  "type/dictionary": {
    "package-name": "typetest-dictionary",
    namespace: "typetest.dictionary",
  },
  "type/enum/extensible": {
    "package-name": "typetest-enum-extensible",
    namespace: "typetest.enum.extensible",
  },
  "type/enum/fixed": {
    "package-name": "typetest-enum-fixed",
    namespace: "typetest.enum.fixed",
  },
  "type/model/empty": {
    "package-name": "typetest-model-empty",
    namespace: "typetest.model.empty",
  },
  "type/model/inheritance/enum-discriminator": {
    "package-name": "typetest-model-enumdiscriminator",
    namespace: "typetest.model.enumdiscriminator",
  },
  "type/model/inheritance/nested-discriminator": {
    "package-name": "typetest-model-nesteddiscriminator",
    namespace: "typetest.model.nesteddiscriminator",
  },
  "type/model/inheritance/not-discriminated": {
    "package-name": "typetest-model-notdiscriminated",
    namespace: "typetest.model.notdiscriminated",
  },
  "type/model/inheritance/single-discriminator": {
    "package-name": "typetest-model-singlediscriminator",
    namespace: "typetest.model.singlediscriminator",
  },
  "type/model/inheritance/recursive": {
    "package-name": "typetest-model-recursive",
    namespace: "typetest.model.recursive",
    "use-pyodide": "true",
  },
  "type/model/usage": {
    "package-name": "typetest-model-usage",
    namespace: "typetest.model.usage",
  },
  "type/model/visibility": [
    {
      "package-name": "typetest-model-visibility",
      namespace: "typetest.model.visibility",
    },
    {
      "package-name": "headasbooleantrue",
      namespace: "headasbooleantrue",
      "head-as-boolean": "true",
    },
    {
      "package-name": "headasbooleanfalse",
      namespace: "headasbooleanfalse",
      "head-as-boolean": "false",
    },
  ],
  "type/property/nullable": {
    "package-name": "typetest-property-nullable",
    namespace: "typetest.property.nullable",
  },
  "type/property/optionality": {
    "package-name": "typetest-property-optional",
    namespace: "typetest.property.optional",
  },
  "type/property/additional-properties": {
    "package-name": "typetest-property-additionalproperties",
    namespace: "typetest.property.additionalproperties",
  },
  "type/scalar": {
    "package-name": "typetest-scalar",
    namespace: "typetest.scalar",
  },
  "type/property/value-types": {
    "package-name": "typetest-property-valuetypes",
    namespace: "typetest.property.valuetypes",
  },
  "type/union": {
    "package-name": "typetest-union",
    namespace: "typetest.union",
  },
};

function toPosix(dir: string): string {
  return dir.replace(/\\/g, "/");
}

function getEmitterOption(spec: string, flavor: string): Record<string, string>[] {
  const specDir = spec.includes("azure") ? AZURE_HTTP_SPECS : HTTP_SPECS;
  const relativeSpec = toPosix(relative(specDir, spec));
  const key = relativeSpec.includes("resiliency/srv-driven/old.tsp")
    ? relativeSpec
    : dirname(relativeSpec);
  const emitter_options = EMITTER_OPTIONS[key] ||
    (flavor === "azure" ? AZURE_EMITTER_OPTIONS[key] : [{}]) || [{}];
  return Array.isArray(emitter_options) ? emitter_options : [emitter_options];
}

// Function to execute CLI commands asynchronously
async function executeCommand(tspCommand: TspCommand): Promise<void> {
  try {
    rmSync(tspCommand.outputDir, { recursive: true, force: true });
  } catch (error) {
    console.error(chalk.red(`rm error: ${error}`));
  }
  const execFileAsync = promisify(execFile);
  try {
    await execFileAsync("tsp", tspCommand.command, { shell: true });
    console.log(chalk.green(`tsp ${tspCommand.command.join(" ")} succeeded`));
  } catch (err) {
    console.error(chalk.red(`exec error: ${err}`));
    throw err;
  }
}

interface RegenerateFlagsInput {
  flavor?: string;
  debug?: boolean;
  name?: string;
  pyodide?: boolean;
}

interface RegenerateFlags {
  flavor: string;
  debug: boolean;
  name?: string;
  pyodide?: boolean;
}

const SpecialFlags: Record<string, Record<string, any>> = {
  azure: {
    "generate-test": true,
    "generate-sample": true,
  },
};

async function getSubdirectories(baseDir: string, flags: RegenerateFlags): Promise<string[]> {
  const subdirectories: string[] = [];

  async function searchDir(currentDir: string) {
    const items = await promises.readdir(currentDir, { withFileTypes: true });

    const promisesArray = items.map(async (item) => {
      const subDirPath = join(currentDir, item.name);
      if (item.isDirectory()) {
        const mainTspPath = join(subDirPath, "main.tsp");
        const clientTspPath = join(subDirPath, "client.tsp");

        const mainTspRelativePath = toPosix(relative(baseDir, mainTspPath));

        // after fix test generation for nested operation group, remove this check
        if (mainTspRelativePath.includes("client-operation-group")) return;

        // after https://github.com/Azure/autorest.python/issues/3043 fixed, remove this check
        if (mainTspRelativePath.includes("azure/client-generator-core/api-version")) return;

        const hasMainTsp = await promises
          .access(mainTspPath)
          .then(() => true)
          .catch(() => false);
        const hasClientTsp = await promises
          .access(clientTspPath)
          .then(() => true)
          .catch(() => false);

        if (mainTspRelativePath.toLowerCase().includes(flags.name || "")) {
          if (mainTspRelativePath.includes("resiliency/srv-driven")) {
            subdirectories.push(resolve(subDirPath, "old.tsp"));
          }
          if (hasClientTsp) {
            subdirectories.push(resolve(subDirPath, "client.tsp"));
          } else if (hasMainTsp) {
            subdirectories.push(resolve(subDirPath, "main.tsp"));
          }
        }

        // Recursively search in the subdirectory
        await searchDir(subDirPath);
      }
    });

    await Promise.all(promisesArray);
  }

  await searchDir(baseDir);
  return subdirectories;
}

function defaultPackageName(spec: string): string {
  const specDir = spec.includes("azure") ? AZURE_HTTP_SPECS : HTTP_SPECS;
  return toPosix(relative(specDir, dirname(spec)))
    .replace(/\//g, "-")
    .toLowerCase();
}

interface EmitterConfig {
  options: string[];
  outputDir: string;
}

function addOptions(
  spec: string,
  generatedFolder: string,
  flags: RegenerateFlags,
): EmitterConfig[] {
  const emitterConfigs: EmitterConfig[] = [];
  for (const config of getEmitterOption(spec, flags.flavor)) {
    const options: Record<string, string> = { ...config };
    if (flags.pyodide) {
      options["use-pyodide"] = "true";
    }
    options["flavor"] = flags.flavor;
    for (const [k, v] of Object.entries(SpecialFlags[flags.flavor] ?? {})) {
      options[k] = v;
    }
    if (options["emitter-output-dir"] === undefined) {
      const packageName = options["package-name"] || defaultPackageName(spec);
      options["emitter-output-dir"] = toPosix(
        `${generatedFolder}/test/${flags.flavor}/generated/${packageName}`,
      );
    }
    if (flags.debug) {
      options["debug"] = "true";
    }
    options["examples-dir"] = toPosix(join(dirname(spec), "examples"));
    const configs = Object.entries(options).flatMap(([k, v]) => {
      return [
        "--option",
        `${argv.values.emitterName || "@typespec/http-client-python"}.${k}="${v}"`,
      ];
    });
    emitterConfigs.push({
      options: configs,
      outputDir: options["emitter-output-dir"],
    });
  }
  return emitterConfigs;
}
function _getCmdList(spec: string, flags: RegenerateFlags): TspCommand[] {
  return addOptions(spec, GENERATED_FOLDER, flags).map((option) => {
    return {
      outputDir: option.outputDir,
      command: ["compile", spec, "--emit", toPosix(PLUGIN_DIR), ...option.options],
    };
  });
}

async function runTaskPool(tasks: Array<() => Promise<void>>, poolLimit: number): Promise<void> {
  let currentIndex = 0;

  async function worker() {
    while (currentIndex < tasks.length) {
      const index = currentIndex++;
      await tasks[index]();
    }
  }

  const workers = new Array(Math.min(poolLimit, tasks.length)).fill(null).map(() => worker());
  await Promise.all(workers);
}

async function regenerate(flags: RegenerateFlagsInput): Promise<void> {
  if (flags.flavor === undefined) {
    await regenerate({ flavor: "azure", ...flags });
    await regenerate({ flavor: "unbranded", ...flags });
  } else {
    const flagsResolved = { debug: false, flavor: flags.flavor, ...flags };
    const subdirectoriesForAzure = await getSubdirectories(AZURE_HTTP_SPECS, flagsResolved);
    const subdirectoriesForNonAzure = await getSubdirectories(HTTP_SPECS, flagsResolved);
    const subdirectories =
      flags.flavor === "azure"
        ? [...subdirectoriesForAzure, ...subdirectoriesForNonAzure]
        : subdirectoriesForNonAzure;
    const cmdList: TspCommand[] = subdirectories.flatMap((subdirectory) =>
      _getCmdList(subdirectory, flagsResolved),
    );

    // Create tasks as functions for the pool
    const tasks: Array<() => Promise<void>> = cmdList.map((tspCommand) => {
      return () => executeCommand(tspCommand);
    });

    // Run tasks with a concurrency limit
    await runTaskPool(tasks, 30);
  }
}

const start = performance.now();
regenerate(argv.values)
  .then(() =>
    console.log(
      chalk.green(
        `Regeneration successful, time taken: ${Math.round((performance.now() - start) / 1000)} s`,
      ),
    ),
  )
  .catch((error) => console.error(chalk.red(`Regeneration failed: ${error.message}`)));
