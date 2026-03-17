import { promises } from "fs";
import { dirname, join, relative, resolve } from "path";

// ---- Shared constants ----

export const SKIP_SPECS: string[] = ["type/file"];

export const SpecialFlags: Record<string, Record<string, any>> = {
  azure: {
    "generate-test": true,
    "generate-sample": true,
  },
};

// ---- Base emitter options (shared across repos) ----

export const BASE_AZURE_EMITTER_OPTIONS: Record<
  string,
  Record<string, string> | Record<string, string>[]
> = {
  "azure/client-generator-core/access": {
    namespace: "specs.azure.clientgenerator.core.access",
  },
  "azure/client-generator-core/alternate-type": {
    namespace: "specs.azure.clientgenerator.core.alternatetype",
  },
  "azure/client-generator-core/api-version": {
    namespace: "specs.azure.clientgenerator.core.apiversion",
  },
  "azure/client-generator-core/client-initialization/default": {
    namespace: "specs.azure.clientgenerator.core.clientinitialization.default",
  },
  "azure/client-generator-core/client-initialization/individually": {
    namespace: "specs.azure.clientgenerator.core.clientinitialization.individually",
  },
  "azure/client-generator-core/client-initialization/individuallyParent": {
    namespace: "specs.azure.clientgenerator.core.clientinitialization.individuallyparent",
  },
  "azure/client-generator-core/client-location": {
    namespace: "specs.azure.clientgenerator.core.clientlocation",
  },
  "azure/client-generator-core/deserialize-empty-string-as-null": {
    namespace: "specs.azure.clientgenerator.core.emptystring",
  },
  "azure/client-generator-core/flatten-property": {
    namespace: "specs.azure.clientgenerator.core.flattenproperty",
  },
  "azure/client-generator-core/usage": {
    namespace: "specs.azure.clientgenerator.core.usage",
  },
  "azure/client-generator-core/override": {
    namespace: "specs.azure.clientgenerator.core.override",
  },
  "azure/client-generator-core/hierarchy-building": {
    namespace: "specs.azure.clientgenerator.core.hierarchybuilding",
  },
  "azure/core/basic": {
    namespace: "specs.azure.core.basic",
  },
  "azure/core/lro/rpc": {
    namespace: "specs.azure.core.lro.rpc",
  },
  "azure/core/lro/standard": {
    namespace: "specs.azure.core.lro.standard",
  },
  "azure/core/model": {
    namespace: "specs.azure.core.model",
  },
  "azure/core/page": {
    namespace: "specs.azure.core.page",
  },
  "azure/core/scalar": {
    namespace: "specs.azure.core.scalar",
  },
  "azure/core/traits": {
    namespace: "specs.azure.core.traits",
  },
  "azure/encode/duration": {
    namespace: "specs.azure.encode.duration",
  },
  "azure/example/basic": {
    namespace: "specs.azure.example.basic",
  },
  "azure/payload/pageable": {
    namespace: "specs.azure.payload.pageable",
  },
  "azure/versioning/previewVersion": {
    namespace: "specs.azure.versioning.previewversion",
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
    namespace: "client.naming.main",
  },
  "client/overload": {
    namespace: "client.overload",
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
  "service/multi-service": {
    namespace: "service.multiservice",
  },
};

export const BASE_EMITTER_OPTIONS: Record<
  string,
  Record<string, string> | Record<string, string>[]
> = {
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
  "authentication/api-key": {
    "clear-output-folder": "true",
  },
  "authentication/http/custom": {
    "package-name": "authentication-http-custom",
    namespace: "authentication.http.custom",
    "package-pprint-name": "Authentication Http Custom",
  },
  "authentication/union": [
    {
      "package-name": "authentication-union",
      namespace: "authentication.union",
    },
    {
      "package-name": "setuppy-authentication-union",
      namespace: "setuppy.authentication.union",
      "keep-setup-py": "true",
    },
  ],
  "type/array": {
    "package-name": "typetest-array",
    namespace: "typetest.array",
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
  "type/union/discriminated": {
    "package-name": "typetest-discriminatedunion",
    namespace: "typetest.discriminatedunion",
  },
  "type/file": {
    "package-name": "typetest-file",
    namespace: "typetest.file",
  },
  documentation: {
    "package-name": "specs-documentation",
    namespace: "specs.documentation",
  },
};

// ---- Shared interfaces ----

export interface TspCommand {
  outputDir: string;
  command: string | string[];
}

export interface RegenerateFlagsInput {
  flavor?: string;
  debug?: boolean;
  name?: string;
  pyodide?: boolean;
}

export interface RegenerateFlags {
  flavor: string;
  debug: boolean;
  name?: string;
  pyodide?: boolean;
}

export interface ProcessedEmitterOption {
  options: Record<string, string>;
  outputDir: string;
}

export interface RegenerateConfig {
  azureHttpSpecs: string;
  httpSpecs: string;
  emitterOptions: Record<string, Record<string, string> | Record<string, string>[]>;
  azureEmitterOptions: Record<string, Record<string, string> | Record<string, string>[]>;
  preprocess: (flags: RegenerateFlagsInput) => Promise<void>;
  getCmdList: (spec: string, flags: RegenerateFlags) => TspCommand[];
  executeCommand: (cmd: TspCommand) => Promise<void>;
}

// ---- Shared utility functions ----

export function toPosix(dir: string): string {
  return dir.replace(/\\/g, "/");
}

export function getEmitterOption(
  spec: string,
  flavor: string,
  config: RegenerateConfig,
): Record<string, string>[] {
  const specDir = spec.includes("azure") ? config.azureHttpSpecs : config.httpSpecs;
  const relativeSpec = toPosix(relative(specDir, spec));
  const key = relativeSpec.includes("resiliency/srv-driven/old.tsp")
    ? relativeSpec
    : dirname(relativeSpec);
  const emitter_options = config.emitterOptions[key] ||
    (flavor === "azure" ? config.azureEmitterOptions[key] : [{}]) || [{}];
  return Array.isArray(emitter_options) ? emitter_options : [emitter_options];
}

export async function getSubdirectories(
  baseDir: string,
  flags: RegenerateFlags,
): Promise<string[]> {
  const subdirectories: string[] = [];

  async function searchDir(currentDir: string) {
    const items = await promises.readdir(currentDir, { withFileTypes: true });

    const promisesArray = items.map(async (item) => {
      const subDirPath = join(currentDir, item.name);
      if (item.isDirectory()) {
        const mainTspPath = join(subDirPath, "main.tsp");
        const clientTspPath = join(subDirPath, "client.tsp");

        const mainTspRelativePath = toPosix(relative(baseDir, mainTspPath));

        if (SKIP_SPECS.some((skipSpec) => mainTspRelativePath.includes(skipSpec))) return;

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

export function defaultPackageName(spec: string, config: RegenerateConfig): string {
  const specDir = spec.includes("azure") ? config.azureHttpSpecs : config.httpSpecs;
  return toPosix(relative(specDir, dirname(spec)))
    .replace(/\//g, "-")
    .toLowerCase();
}

export function buildOptions(
  spec: string,
  generatedFolder: string,
  flags: RegenerateFlags,
  config: RegenerateConfig,
): ProcessedEmitterOption[] {
  const results: ProcessedEmitterOption[] = [];
  for (const emitterConfig of getEmitterOption(spec, flags.flavor, config)) {
    const options: Record<string, string> = { ...emitterConfig };
    if (flags.pyodide) {
      options["use-pyodide"] = "true";
    }
    options["flavor"] = flags.flavor;
    for (const [k, v] of Object.entries(SpecialFlags[flags.flavor] ?? {})) {
      options[k] = v;
    }
    if (options["emitter-output-dir"] === undefined) {
      const packageName = options["package-name"] || defaultPackageName(spec, config);
      options["emitter-output-dir"] = toPosix(
        `${generatedFolder}/test/${flags.flavor}/generated/${packageName}`,
      );
    }
    if (flags.debug) {
      options["debug"] = "true";
    }
    options["examples-dir"] = toPosix(join(dirname(spec), "examples"));
    results.push({
      options,
      outputDir: options["emitter-output-dir"],
    });
  }
  return results;
}

export async function runTaskPool(
  tasks: Array<() => Promise<void>>,
  poolLimit: number,
): Promise<void> {
  async function worker(start: number, end: number) {
    while (start < end) {
      await tasks[start]();
      start++;
    }
  }

  const workers = [];
  let start = 0;
  while (start < tasks.length) {
    const end = Math.min(start + poolLimit, tasks.length);
    workers.push((async () => await worker(start, end))());
    start = end;
  }
  await Promise.all(workers);
}

export async function regenerate(
  flags: RegenerateFlagsInput,
  config: RegenerateConfig,
): Promise<void> {
  if (flags.flavor === undefined) {
    await regenerate({ flavor: "azure", ...flags }, config);
    await regenerate({ flavor: "unbranded", ...flags }, config);
  } else {
    await config.preprocess(flags);

    const flagsResolved: RegenerateFlags = { debug: false, flavor: flags.flavor, ...flags };
    const subdirectoriesForAzure = await getSubdirectories(config.azureHttpSpecs, flagsResolved);
    const subdirectoriesForNonAzure = await getSubdirectories(config.httpSpecs, flagsResolved);
    const subdirectories =
      flags.flavor === "azure"
        ? [...subdirectoriesForAzure, ...subdirectoriesForNonAzure]
        : subdirectoriesForNonAzure;
    const cmdList: TspCommand[] = subdirectories.flatMap((subdirectory) =>
      config.getCmdList(subdirectory, flagsResolved),
    );

    // Create tasks as functions for the pool
    const tasks: Array<() => Promise<void>> = cmdList.map((tspCommand) => {
      return () => config.executeCommand(tspCommand);
    });

    // Run tasks with a concurrency limit
    await runTaskPool(tasks, 30);
  }
}
