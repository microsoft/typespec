import jsyaml from "js-yaml";
import { createDiagnostic } from "../core/messages.js";
import { getDirectoryPath, isPathAbsolute, joinPaths, resolvePath } from "../core/path-utils.js";
import { createJSONSchemaValidator } from "../core/schema-validator.js";
import { CompilerHost, Diagnostic, NoTarget } from "../core/types.js";
import { deepClone, deepFreeze, doIO, loadFile, omitUndefined } from "../core/util.js";
import { TypeSpecConfigJsonSchema } from "./config-schema.js";
import { TypeSpecConfig, TypeSpecRawConfig } from "./types.js";

export const OldTypeSpecConfigFilename = "cadl-project.yaml";
export const TypeSpecConfigFilename = "tspconfig.yaml";

export const defaultConfig = deepFreeze({
  outputDir: "{cwd}/typespec-output",
  diagnostics: [] as Diagnostic[],
});

/**
 * Look for the project root by looking up until a `tspconfig.yaml` is found.
 * @param path Path to start looking
 */
export async function findTypeSpecConfigPath(
  host: CompilerHost,
  path: string
): Promise<string | undefined> {
  let current = path;
  while (true) {
    let pkgPath = await searchConfigFile(host, current, TypeSpecConfigFilename);
    if (pkgPath === undefined) {
      pkgPath = await searchConfigFile(host, current, OldTypeSpecConfigFilename);
    }
    // if found either file in current folder, return it
    if (pkgPath !== undefined) {
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
 * Load the typespec configuration for the provided directory
 * @param host
 * @param directoryPath
 */
export async function loadTypeSpecConfigForPath(
  host: CompilerHost,
  directoryPath: string
): Promise<TypeSpecConfig> {
  const typespecConfigPath = await findTypeSpecConfigPath(host, directoryPath);
  if (typespecConfigPath === undefined) {
    return { ...deepClone(defaultConfig), projectRoot: directoryPath };
  }
  return loadTypeSpecConfigFile(host, typespecConfigPath);
}

/**
 * Load given file as a TypeSpec configuration
 */
export async function loadTypeSpecConfigFile(
  host: CompilerHost,
  filePath: string
): Promise<TypeSpecConfig> {
  const config = await loadConfigFile(host, filePath, jsyaml.load);
  if (config.diagnostics.length === 0 && config.extends) {
    const extendPath = resolvePath(getDirectoryPath(filePath), config.extends);
    const parent = await loadTypeSpecConfigFile(host, extendPath);
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

const configValidator = createJSONSchemaValidator(TypeSpecConfigJsonSchema);

async function searchConfigFile(
  host: CompilerHost,
  path: string,
  filename: string
): Promise<string | undefined> {
  const pkgPath = joinPaths(path, filename);
  const stat = await doIO(
    () => host.stat(pkgPath),
    pkgPath,
    () => {}
  );

  return stat?.isFile() === true ? pkgPath : undefined;
}

async function loadConfigFile(
  host: CompilerHost,
  filename: string,
  loadData: (content: string) => any
): Promise<TypeSpecConfig> {
  let diagnostics: Diagnostic[] = [];
  const reportDiagnostic = (d: Diagnostic) => diagnostics.push(d);

  let [data, file] = await loadFile<TypeSpecRawConfig>(host, filename, loadData, reportDiagnostic);

  if (data) {
    diagnostics = diagnostics.concat(configValidator.validate(data, file));
  }

  if (!data || diagnostics.length > 0) {
    // NOTE: Don't trust the data if there are errors and use default
    // config. Otherwise, we may return an object that does not conform to
    // TypeSpecConfig's typing.
    data = deepClone(defaultConfig) as TypeSpecRawConfig;
  }

  let emit = data.emit;
  let options = data.options;

  // @deprecated Legacy backward compatibility of emitters option. To remove March Sprint.
  if (data.emitters) {
    diagnostics.push(
      createDiagnostic({
        code: "deprecated",
        format: {
          message:
            "`emitters` options in tspconfig.yaml is deprecated use `emit` and `options` instead.",
        },
        target: NoTarget,
      })
    );
    emit = [];
    options = {};
    for (const [name, emitterOptions] of Object.entries(data.emitters)) {
      if (emitterOptions === true) {
        emit.push(name);
        options[name] = {};
      } else if (emitterOptions === false) {
      } else {
        emit.push(name);
        options[name] = emitterOptions;
      }
    }
  }

  return omitUndefined({
    projectRoot: getDirectoryPath(filename),
    filename,
    diagnostics,
    extends: data.extends,
    environmentVariables: data["environment-variables"],
    parameters: data.parameters,
    outputDir: data["output-dir"] ?? "{cwd}/typespec-output",
    warnAsError: data["warn-as-error"],
    imports: data.imports,
    trace: typeof data.trace === "string" ? [data.trace] : data.trace,
    emit,
    options,
  });
}

export function validateConfigPathsAbsolute(config: TypeSpecConfig): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  function checkPath(value: string | undefined) {
    if (value === undefined) {
      return;
    }
    const diagnostic = validatePathAbsolute(value);
    if (diagnostic) {
      diagnostics.push(diagnostic);
    }
  }

  checkPath(config.outputDir);
  for (const emitterOptions of Object.values(config.options ?? {})) {
    checkPath(emitterOptions["emitter-output-dir"]);
  }
  return diagnostics;
}

function validatePathAbsolute(path: string): Diagnostic | undefined {
  if (path.startsWith(".") || !isPathAbsolute(path)) {
    return createDiagnostic({
      code: "config-path-absolute",
      format: { path },
      target: NoTarget,
    });
  }

  return undefined;
}
