/* eslint-disable no-console */
import { exec as execCallback } from "child_process";
import { promises } from "fs";
import { dirname, join, relative, resolve } from "path";
import { fileURLToPath } from "url";
import { promisify } from "util";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

// Promisify the exec function
const exec = promisify(execCallback);

// Get the directory of the current file
const PLUGIN_DIR = resolve(fileURLToPath(import.meta.url), "../../../");
const CADL_RANCH_DIR = resolve(PLUGIN_DIR, "node_modules/@azure-tools/cadl-ranch-specs/http");

const EMITTER_OPTIONS: Record<string, Record<string, string> | Record<string, string>[]> = {
  "resiliency/srv-driven/old.tsp": {
    "package-name": "resiliency-srv-driven1",
    "package-mode": "azure-dataplane",
    "package-pprint-name": "ResiliencySrvDriven1",
  },
  "resiliency/srv-driven": {
    "package-name": "resiliency-srv-driven2",
    "package-mode": "azure-dataplane",
    "package-pprint-name": "ResiliencySrvDriven2",
  },
  "authentication/http/custom": {
    "package-name": "authentication-http-custom",
  },
  "authentication/union": {
    "package-name": "authentication-union",
  },
  "type/array": {
    "package-name": "typetest-array",
  },
  "type/dictionary": {
    "package-name": "typetest-dictionary",
  },
  "type/enum/extensible": {
    "package-name": "typetest-enum-extensible",
  },
  "type/enum/fixed": {
    "package-name": "typetest-enum-fixed",
  },
  "type/model/empty": {
    "package-name": "typetest-model-empty",
  },
  "type/model/flatten": {
    "package-name": "typetest-model-flatten",
  },
  "type/model/inheritance/enum-discriminator": {
    "package-name": "typetest-model-enumdiscriminator",
  },
  "type/model/inheritance/nested-discriminator": {
    "package-name": "typetest-model-nesteddiscriminator",
  },
  "type/model/inheritance/not-discriminated": {
    "package-name": "typetest-model-notdiscriminated",
  },
  "type/model/inheritance/single-discriminator": {
    "package-name": "typetest-model-singlediscriminator",
  },
  "type/model/inheritance/recursive": {
    "package-name": "typetest-model-recursive",
  },
  "type/model/usage": {
    "package-name": "typetest-model-usage",
  },
  "type/model/visibility": [
    { "package-name": "typetest-model-visibility" },
    { "package-name": "headasbooleantrue", "head-as-boolean": "true" },
    { "package-name": "headasbooleanfalse", "head-as-boolean": "false" },
  ],
  "type/property/nullable": {
    "package-name": "typetest-property-nullable",
  },
  "type/property/optionality": {
    "package-name": "typetest-property-optional",
  },
  "type/property/additional-properties": {
    "package-name": "typetest-property-additionalproperties",
  },
  "type/scalar": {
    "package-name": "typetest-scalar",
  },
  "type/property/value-types": {
    "package-name": "typetest-property-valuetypes",
  },
  "type/union": {
    "package-name": "typetest-union",
  },
  "azure/core/lro/rpc": {
    "package-name": "azurecore-lro-rpc",
  },
  "client/structure/multi-client": {
    "package-name": "client-structure-multiclient",
  },
  "client/structure/renamed-operation": {
    "package-name": "client-structure-renamedoperation",
  },
  "client/structure/two-operation-group": {
    "package-name": "client-structure-twooperationgroup",
  },
  "mgmt/sphere": [{ "package-name": "azure-mgmt-spheredpg" }],
};

function toPosix(dir: string): string {
  return dir.replace(/\\/g, "/");
}

function getEmitterOption(spec: string): Record<string, string>[] {
  const relativeSpec = toPosix(relative(CADL_RANCH_DIR, spec));
  const key = relativeSpec.includes("resiliency/srv-driven/old.tsp")
    ? relativeSpec
    : dirname(relativeSpec);
  const result = EMITTER_OPTIONS[key] || [{}];
  return Array.isArray(result) ? result : [result];
}

// Function to execute CLI commands asynchronously
async function executeCommand(command: string): Promise<void> {
  try {
    const { stdout, stderr } = await exec(command);
    if (stdout) console.log(`stdout: ${stdout}`);
    if (stderr) console.error(`stderr: ${stderr}`);
  } catch (error) {
    console.error(`exec error: ${error}`);
    throw error;
  }
}

interface RegenerateFlagsInput {
  flavor?: "azure" | "unbranded";
  debug?: boolean;
  name?: string;
}

interface RegenerateFlags {
  flavor: "azure" | "unbranded";
  debug: boolean;
  name?: string;
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
        if (flags.flavor === "unbranded" && mainTspRelativePath.includes("azure")) return;

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
  return toPosix(relative(CADL_RANCH_DIR, dirname(spec)))
    .replace(/\//g, "-")
    .toLowerCase();
}

function addOptions(spec: string, generatedFolder: string, flags: RegenerateFlags): string[] {
  const emitterConfigs: string[] = [];
  for (const config of getEmitterOption(spec)) {
    const options: Record<string, string> = { ...config };
    options["flavor"] = flags.flavor;
    for (const [k, v] of Object.entries(SpecialFlags[flags.flavor] ?? {})) {
      options[k] = v;
    }
    if (options["emitter-output-dir"] === undefined) {
      const packageName = options["package-name"] || defaultPackageName(spec);
      options["emitter-output-dir"] = toPosix(
        `${generatedFolder}/test/${flags.flavor}/generated/${packageName}`
      );
    }
    if (flags.debug) {
      options["debug"] = "true";
    }
    if (flags.flavor === "unbranded") {
      options["company-name"] = "Unbranded";
    }
    options["examples-directory"] = toPosix(join(dirname(spec), "examples"));
    const configs = Object.entries(options).flatMap(([k, v]) => {
      return `--option @azure-tools/typespec-python.${k}=${v}`;
    });
    emitterConfigs.push(configs.join(" "));
  }
  return emitterConfigs;
}

async function _regenerateSingle(spec: string, flags: RegenerateFlags): Promise<void> {
  // Perform some asynchronous operation here
  const options = addOptions(spec, PLUGIN_DIR, flags);
  const commandPromises = options.map((option) => {
    const command = `tsp compile ${spec} --emit=${toPosix(PLUGIN_DIR)} ${option}`;
    console.log(command);
    return executeCommand(command);
  });
  await Promise.all(commandPromises);
}

async function regenerate(flags: RegenerateFlagsInput): Promise<boolean> {
  if (flags.flavor === undefined) {
    const azureGeneration = await regenerate({ ...flags, flavor: "azure" });
    const unbrandedGeneration = await regenerate({ ...flags, flavor: "unbranded" });
    return azureGeneration && unbrandedGeneration;
  } else {
    const flagsResolved = { debug: false, flavor: flags.flavor, ...flags };
    const CADL_RANCH_DIR = resolve(PLUGIN_DIR, "node_modules/@azure-tools/cadl-ranch-specs/http");
    const subdirectories = await getSubdirectories(CADL_RANCH_DIR, flagsResolved);
    const promises = subdirectories.map(async (subdirectory) => {
      // Perform additional asynchronous operations on each subdirectory here
      await _regenerateSingle(subdirectory, flagsResolved);
    });
    await Promise.all(promises);
    return true;
  }
}

//   try {
//     const output = await executeCommand('tsp compile');
//     console.log(`Command output: ${output}`);
//   } catch (error) {
//     console.error(`Command failed: ${error}`);
//   }

// PARSE INPUT ARGUMENTS
const argv = yargs(hideBin(process.argv))
  .option("flavor", {
    type: "string",
    choices: ["azure", "unbranded"],
    description: "Specify the flavor",
  })
  .option("debug", {
    alias: "d",
    type: "boolean",
    description: "Debug mode",
  })
  .option("name", {
    alias: "n",
    type: "string",
    description: "Specify filename if you only want to generate a subset",
  }).argv;

regenerate(argv as RegenerateFlags)
  .then(() => console.log("Regeneration successful"))
  .catch((error) => console.error(`Regeneration failed: ${error.message}`));
