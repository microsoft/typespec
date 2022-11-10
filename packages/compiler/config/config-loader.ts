import jsyaml from "js-yaml";
import { getDirectoryPath, joinPaths, resolvePath } from "../core/path-utils.js";
import { createJSONSchemaValidator } from "../core/schema-validator.js";
import { CompilerHost, Diagnostic } from "../core/types.js";
import { deepClone, deepFreeze, doIO, loadFile } from "../core/util.js";
import { CadlConfigJsonSchema } from "./config-schema.js";
import { CadlConfig, CadlRawConfig } from "./types.js";

export const CadlConfigFilename = "cadl-project.yaml";

export const defaultConfig = deepFreeze({
  outputDir: "{cwd}/cadl-output",
  diagnostics: [],
  emitters: {},
});

/**
 * Look for the project root by looking up until a `cadl-project.yaml` is found.
 * @param path Path to start looking
 */
export async function findCadlConfigPath(
  host: CompilerHost,
  path: string
): Promise<string | undefined> {
  let current = path;
  while (true) {
    const pkgPath = joinPaths(current, CadlConfigFilename);
    const stat = await doIO(
      () => host.stat(pkgPath),
      pkgPath,
      () => {}
    );

    if (stat?.isFile()) {
      return pkgPath;
    }
    const parent = getDirectoryPath(current);
    if (parent === current) {
      return undefined;
    }
    current = parent;
  }
}

/**
 * Load the cadl configuration for the provided directory
 * @param host
 * @param directoryPath
 */
export async function loadCadlConfigForPath(
  host: CompilerHost,
  directoryPath: string
): Promise<CadlConfig> {
  const cadlConfigPath = await findCadlConfigPath(host, directoryPath);
  if (cadlConfigPath === undefined) {
    return { ...deepClone(defaultConfig), projectRoot: directoryPath };
  }
  return loadCadlConfigFile(host, cadlConfigPath);
}

/**
 * Load given file as a Cadl configuration
 */
export async function loadCadlConfigFile(
  host: CompilerHost,
  filePath: string
): Promise<CadlConfig> {
  const config = await loadConfigFile(host, filePath, jsyaml.load);
  if (config.diagnostics.length === 0 && config.extends) {
    const extendPath = resolvePath(getDirectoryPath(filePath), config.extends);
    const parent = await loadCadlConfigFile(host, extendPath);
    if (parent.diagnostics.length > 0) {
      return {
        ...config,
        diagnostics: parent.diagnostics,
      };
    }

    return {
      ...parent,
      ...config,
    };
  }

  return {
    ...deepClone(defaultConfig),
    ...config,
  };
}

const configValidator = createJSONSchemaValidator(CadlConfigJsonSchema);

async function loadConfigFile(
  host: CompilerHost,
  filename: string,
  loadData: (content: string) => any
): Promise<CadlConfig> {
  let diagnostics: Diagnostic[] = [];
  const reportDiagnostic = (d: Diagnostic) => diagnostics.push(d);

  let [data, file] = await loadFile<CadlRawConfig>(host, filename, loadData, reportDiagnostic);

  if (data) {
    diagnostics = diagnostics.concat(configValidator.validate(data, file));
  }

  if (!data || diagnostics.length > 0) {
    // NOTE: Don't trust the data if there are errors and use default
    // config. Otherwise, we may return an object that does not conform to
    // CadlConfig's typing.
    data = deepClone(defaultConfig);
  }

  let emitters: Record<string, Record<string, unknown>> | undefined = undefined;
  if (data.emitters) {
    emitters = {};
    for (const [name, options] of Object.entries(data.emitters)) {
      if (options === true) {
        emitters[name] = {};
      } else if (options === false) {
      } else {
        emitters[name] = options;
      }
    }
  }

  return cleanUndefined({
    projectRoot: getDirectoryPath(filename),
    filename,
    diagnostics,
    extends: data.extends,
    environmentVariables: data["environment-variables"],
    parameters: data.parameters,
    outputDir: data["output-dir"] ?? "{cwd}/cadl-output",
    warnAsError: data["warn-as-error"],
    imports: data.imports,
    trace: typeof data.trace === "string" ? [data.trace] : data.trace,
    emitters: emitters!,
  });
}

function cleanUndefined<T extends Record<string, unknown>>(data: T): T {
  return Object.fromEntries(Object.entries(data).filter(([k, v]) => v !== undefined)) as any;
}
