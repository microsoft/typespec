import { readFile } from "fs/promises";
import { basename, extname, join } from "path";
import { createDiagnostic, createSourceFile } from "../compiler/diagnostics.js";
import { Diagnostic } from "../compiler/types.js";
import { deepClone, deepFreeze } from "../compiler/util.js";
import { ConfigValidator } from "./config-validator.js";
import { ADLConfig } from "./types.js";

const configFilenames = [".adlrc.yaml", ".adlrc.yml", ".adlrc.json", "package.json"];
const defaultConfig: ADLConfig = deepFreeze({
  plugins: [],
  diagnostics: [],
  emitters: {},
  lint: {
    extends: [],
    rules: {},
  },
});

/**
 * Load ADL Configuration if present.
 * @param directoryPath Current working directory where the config should be.
 */
export async function loadADLConfigInDir(directoryPath: string): Promise<ADLConfig> {
  for (const filename of configFilenames) {
    const filePath = join(directoryPath, filename);
    try {
      return await loadADLConfigFile(filePath);
    } catch (e) {
      if (e.code === "ENOENT") {
        continue;
      }
      throw e;
    }
  }
  return deepClone(defaultConfig);
}

/**
 * Load given file as an adl configuration
 */
export async function loadADLConfigFile(filePath: string): Promise<ADLConfig> {
  switch (extname(filePath)) {
    case ".json":
      if (basename(filePath) === "package.json") {
        return loadPackageJSONConfigFile(filePath);
      }
      return loadJSONConfigFile(filePath);

    case ".yaml":
    case ".yml":
      return loadYAMLConfigFile(filePath);

    default:
      // This is not a diagnostic because the compiler only tries the
      // well-known config file names.
      throw new RangeError("Config file must have .yaml, .yml, or .json extension.");
  }
}

export async function loadPackageJSONConfigFile(filePath: string): Promise<ADLConfig> {
  return await loadConfigFile(filePath, (content) => JSON.parse(content).adl ?? {});
}

export async function loadJSONConfigFile(filePath: string): Promise<ADLConfig> {
  return await loadConfigFile(filePath, JSON.parse);
}

export async function loadYAMLConfigFile(filePath: string): Promise<ADLConfig> {
  // Lazy load.
  const jsyaml = await import("js-yaml");
  return await loadConfigFile(filePath, jsyaml.load);
}

const configValidator = new ConfigValidator();

async function loadConfigFile(
  filePath: string,
  loadData: (content: string) => any
): Promise<ADLConfig> {
  const content = await readFile(filePath, "utf-8");
  const file = createSourceFile(content, filePath);

  let loadDiagnostics: Diagnostic[];
  let data: any;
  try {
    data = loadData(content);
    loadDiagnostics = [];
  } catch (e) {
    loadDiagnostics = [createDiagnostic(e.message, { file, pos: 0, end: 0 })];
  }

  const validationDiagnostics = configValidator.validateConfig(data);
  const diagnostics = [...loadDiagnostics, ...validationDiagnostics];

  if (diagnostics.some((d) => d.severity === "error")) {
    // NOTE: Don't trust the data if there are validation errors, and use
    // default config. Otherwise, we may return an object that does not
    // conform to ADLConfig's typing.
    data = defaultConfig;
  } else {
    mergeDefaults(data, defaultConfig);
  }

  return {
    ...data,
    filename: filePath,
    diagnostics,
  };
}

/**
 * Recursively add properties from defaults that are not present in target.
 */
function mergeDefaults(target: any, defaults: any) {
  for (const prop in defaults) {
    const value = target[prop];
    if (value === undefined) {
      target[prop] = deepClone(defaults[prop]);
    } else if (typeof value === "object" && typeof defaults[prop] === "object") {
      mergeDefaults(value, defaults[prop]);
    }
  }
}
