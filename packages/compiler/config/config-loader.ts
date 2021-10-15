import { basename, extname, join } from "path";
import { SchemaValidator } from "../core/schema-validator.js";
import { CompilerHost, Diagnostic } from "../core/types.js";
import { deepClone, deepFreeze, loadFile } from "../core/util.js";
import { CadlConfigJsonSchema } from "./config-schema.js";
import { CadlConfig } from "./types.js";

const configFilenames = [".cadlrc.yaml", ".cadlrc.yml", ".cadlrc.json", "package.json"];
const defaultConfig: CadlConfig = deepFreeze({
  plugins: [],
  diagnostics: [],
  emitters: {},
  lint: {
    extends: [],
    rules: {},
  },
});

/**
 * Load Cadl Configuration if present.
 * @param directoryPath Current working directory where the config should be.
 */
export async function loadCadlConfigInDir(
  host: CompilerHost,
  directoryPath: string
): Promise<CadlConfig> {
  for (const filename of configFilenames) {
    const filePath = join(directoryPath, filename);
    const config = await loadCadlConfigFile(host, filePath);
    if (config.diagnostics.length === 1 && config.diagnostics[0].code === "file-not-found") {
      continue;
    }
    return config;
  }
  return deepClone(defaultConfig);
}

/**
 * Load given file as a Cadl configuration
 */
export async function loadCadlConfigFile(
  host: CompilerHost,
  filePath: string
): Promise<CadlConfig> {
  switch (extname(filePath)) {
    case ".json":
      if (basename(filePath) === "package.json") {
        return loadPackageJSONConfigFile(host, filePath);
      }
      return loadJSONConfigFile(host, filePath);

    case ".yaml":
    case ".yml":
      return loadYAMLConfigFile(host, filePath);

    default:
      // This is not a diagnostic because the compiler only tries the
      // well-known config file names.
      throw new RangeError("Config file must have .yaml, .yml, or .json extension.");
  }
}

export async function loadPackageJSONConfigFile(
  host: CompilerHost,
  filePath: string
): Promise<CadlConfig> {
  return await loadConfigFile(host, filePath, (content) => JSON.parse(content).cadl ?? {});
}

export async function loadJSONConfigFile(
  host: CompilerHost,
  filePath: string
): Promise<CadlConfig> {
  return await loadConfigFile(host, filePath, JSON.parse);
}

export async function loadYAMLConfigFile(
  host: CompilerHost,
  filePath: string
): Promise<CadlConfig> {
  // Lazy load.
  const jsyaml = await import("js-yaml");
  return await loadConfigFile(host, filePath, jsyaml.load);
}

const configValidator = new SchemaValidator(CadlConfigJsonSchema);

async function loadConfigFile(
  host: CompilerHost,
  filePath: string,
  loadData: (content: string) => any
): Promise<CadlConfig> {
  let diagnostics: Diagnostic[] = [];
  const reportDiagnostic = (d: Diagnostic) => diagnostics.push(d);

  let [data, file] = await loadFile(host, filePath, loadData, reportDiagnostic);

  if (data) {
    diagnostics = diagnostics.concat(configValidator.validate(data, file));
  }

  if (!data || diagnostics.length > 0) {
    // NOTE: Don't trust the data if there are errors and use default
    // config. Otherwise, we may return an object that does not conform to
    // CadlConfig's typing.
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
