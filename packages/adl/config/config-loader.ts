import { readFile } from "fs/promises";
import { basename, extname, join } from "path";
import { Message } from "../compiler/diagnostics.js";
import { Diagnostic } from "../compiler/types.js";
import { deepClone, deepFreeze, loadFile } from "../compiler/util.js";
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
    const config = await loadADLConfigFile(filePath);
    if (
      config.diagnostics.length === 1 &&
      config.diagnostics[0].code === Message.FileNotFound.code
    ) {
      continue;
    }
    return config;
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
  const diagnostics: Diagnostic[] = [];
  const reportDiagnostic = (d: Diagnostic) => diagnostics.push(d);

  let [data, file] = await loadFile(
    (path) => readFile(path, "utf-8"),
    filePath,
    loadData,
    reportDiagnostic
  );

  if (data) {
    configValidator.validateConfig(data, file, reportDiagnostic);
  }

  if (!data || diagnostics.length > 0) {
    // NOTE: Don't trust the data if there are errors and use default
    // config. Otherwise, we may return an object that does not conform to
    // ADLConfig's typing.
    data = deepClone(defaultConfig);
  } else {
    mergeDefaults(data, defaultConfig);
  }

  data.filename = filePath;
  data.diagnostics = diagnostics;
  return data;
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
