import { access, readFile } from "fs/promises";
import { basename, extname, join } from "path";
import { createSourceFile, Message, NoTarget, throwDiagnostic } from "../compiler/diagnostics.js";
import { ConfigValidator } from "./config-validator.js";
import { ADLConfig, ADLRawConfig, ConfigFile } from "./types.js";

const configFilenames = [".adlrc.yaml", ".adlrc.yml", ".adlrc.json", "package.json"];

const defaultConfig: ADLConfig = {
  plugins: [],
  emitters: {},
  lint: {
    extends: [],
    rules: {},
  },
};

/**
 * Load ADL Configuration if present.
 * @param directoryPath Current working directory where the config should be.
 */
export async function loadADLConfigInDir(directoryPath: string): Promise<ADLConfig> {
  for (const filename of configFilenames) {
    const filePath = join(directoryPath, filename);
    if (await fileExists(filePath)) {
      return loadADLConfigFile(filePath);
    }
  }
  return defaultConfig;
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
      throwDiagnostic(Message.InvalidConfigFormat, NoTarget, [filePath]);
  }
}

export async function loadPackageJSONConfigFile(filePath: string): Promise<ADLConfig> {
  const rawConfig = await loadJSON<any>(filePath);
  if (rawConfig.data.adl) {
    return normalizeConfig({ file: rawConfig.file, data: rawConfig.data.adl });
  } else {
    return defaultConfig;
  }
}

export async function loadJSONConfigFile(filePath: string): Promise<ADLConfig> {
  const rawConfig = await loadJSON<ADLRawConfig>(filePath);
  return normalizeConfig(rawConfig);
}

/**
 * Loads a YAML configuration from a file.
 * @param filePath Path to the file.
 */
export async function loadYAMLConfigFile(filePath: string): Promise<ADLConfig> {
  const rawConfig = await loadYaml(filePath);
  return normalizeConfig(rawConfig);
}

/**
 * Load YAML and throw @see DiagnosticError if there is an issue.
 * @param filePath Yaml file path.
 * @returns Parsed object.
 */
async function loadYaml(filePath: string): Promise<ConfigFile<ADLRawConfig>> {
  // Lazy load.
  const jsyaml = await import("js-yaml");

  const content = (await readFile(filePath)).toString();
  const file = createSourceFile(content, filePath);
  try {
    return {
      file,
      data: jsyaml.load(content) as ADLRawConfig,
    };
  } catch (e) {
    throwDiagnostic(e.message, { file, pos: 0, end: 0 });
  }
}

/**
 * Load JSON and throw @see DiagnosticError if there is an issue.
 * @param filePath JSON file path.
 * @returns Parsed object.
 */
async function loadJSON<T>(filePath: string): Promise<ConfigFile<T>> {
  const content = (await readFile(filePath)).toString();
  const file = createSourceFile(content, filePath);

  try {
    return {
      file,
      data: JSON.parse(content),
    };
  } catch (e) {
    throwDiagnostic(e.message, { file, pos: 0, end: 0 });
  }
}

const configValidator = new ConfigValidator();
export function normalizeConfig(config: ConfigFile<ADLRawConfig>): ADLConfig {
  configValidator.validateConfig(config.data, config.file);
  return {
    filename: config.file.path,
    ...defaultConfig,
    ...config.data,
    lint: {
      ...defaultConfig.lint,
      ...(config.data.lint ?? {}),
    },
  };
}

/**
 * Validate the given config is valid.
 */
export function validateConfig(config: ADLRawConfig) {
  return {} as any;
}

async function fileExists(path: string) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
