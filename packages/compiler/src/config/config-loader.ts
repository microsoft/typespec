import { createDiagnostic } from "../core/messages.js";
import { getDirectoryPath, isPathAbsolute, joinPaths, resolvePath } from "../core/path-utils.js";
import { createJSONSchemaValidator } from "../core/schema-validator.js";
import { createSourceFile } from "../core/source-file.js";
import { CompilerHost, Diagnostic, NoTarget, SourceFile } from "../core/types.js";
import { deepClone, deepFreeze, doIO, omitUndefined } from "../utils/misc.js";
import { getLocationInYamlScript } from "../yaml/index.js";
import { parseYaml } from "../yaml/parser.js";
import { YamlScript } from "../yaml/types.js";
import { TypeSpecConfigJsonSchema } from "./config-schema.js";
import { TypeSpecConfig, TypeSpecRawConfig } from "./types.js";

export const OldTypeSpecConfigFilename = "cadl-project.yaml";
export const TypeSpecConfigFilename = "tspconfig.yaml";

export const defaultConfig = deepFreeze({
  outputDir: "{cwd}/tsp-output",
  diagnostics: [] as Diagnostic[],
});

/**
 * Look for the project root by looking up until a `tspconfig.yaml` is found.
 * @param path Path to the file or the folder to start looking
 */
export async function findTypeSpecConfigPath(
  host: CompilerHost,
  path: string,
  lookup: boolean = true
): Promise<string | undefined> {
  // if the path is a file, return immediately
  const stats = await doIO(
    () => host.stat(path),
    path,
    () => {},
    { allowFileNotFound: true }
  );
  if (!stats) {
    return undefined;
  } else if (stats.isFile()) {
    return path;
  }
  let current = path;

  // only recurse if the path is a directory and the flag was set to true (only for default case)
  // otherwise, look in the specific directory for tspconfig.yaml ONLY (not cadl-project.yaml)
  if (!lookup) {
    current = `${path}/tspconfig.yaml`;
    const stats = await doIO(
      () => host.stat(current),
      current,
      () => {},
      { allowFileNotFound: true }
    );
    if (stats?.isFile()) {
      return current;
    }
    return undefined;
  } else {
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
}

/**
 * Load the TypeSpec configuration for the provided path or directory
 * @param host
 * @param path
 */
export async function loadTypeSpecConfigForPath(
  host: CompilerHost,
  path: string,
  errorIfNotFound: boolean = false,
  lookup: boolean = true
): Promise<TypeSpecConfig> {
  const typespecConfigPath = await findTypeSpecConfigPath(host, path, lookup);
  if (typespecConfigPath === undefined) {
    const projectRoot = getDirectoryPath(path);
    const tsConfig = { ...deepClone(defaultConfig), projectRoot: projectRoot };
    if (errorIfNotFound) {
      tsConfig.diagnostics.push(
        createDiagnostic({
          code: "config-path-not-found",
          format: {
            path: path,
          },
          target: NoTarget,
        })
      );
    }
    return tsConfig;
  }

  const tsConfig = await loadTypeSpecConfigFile(host, typespecConfigPath);
  // Add diagnostics if still using cadl-project.yaml
  if (typespecConfigPath.endsWith(OldTypeSpecConfigFilename)) {
    tsConfig.diagnostics.push(
      createDiagnostic({
        code: "deprecated",
        format: {
          message: "`cadl-project.yaml` is deprecated. Please rename to `tspconfig.yaml`.",
        },
        target: NoTarget,
      })
    );
  }
  return tsConfig;
}

/**
 * Load given file as a TypeSpec configuration
 */
export async function loadTypeSpecConfigFile(
  host: CompilerHost,
  filePath: string
): Promise<TypeSpecConfig> {
  const config = await loadConfigFile(host, filePath, parseYaml);
  if (config.diagnostics.length === 0 && config.extends) {
    const extendPath = resolvePath(getDirectoryPath(filePath), config.extends);
    const parent = await loadTypeSpecConfigFile(host, extendPath);

    // Add diagnostics if still using cadl-project.yaml
    if (filePath.endsWith(OldTypeSpecConfigFilename)) {
      parent.diagnostics.push(
        createDiagnostic({
          code: "deprecated",
          format: {
            message: "`cadl-project.yaml` is deprecated. Please rename to `tspconfig.yaml`.",
          },
          target: NoTarget,
        })
      );
    }

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
  loadData: (content: SourceFile) => [YamlScript, readonly Diagnostic[]]
): Promise<TypeSpecConfig> {
  let diagnostics: Diagnostic[] = [];
  const reportDiagnostic = (d: Diagnostic) => diagnostics.push(d);
  const file =
    (await doIO(host.readFile, filename, reportDiagnostic)) ?? createSourceFile("", filename);
  const [yamlScript, yamlDiagnostics] = loadData(file);
  yamlDiagnostics.forEach((d) => reportDiagnostic(d));

  let data: any = yamlScript.value;

  if (data) {
    diagnostics = diagnostics.concat(configValidator.validate(data, yamlScript));
  }

  if (!data || diagnostics.length > 0) {
    // NOTE: Don't trust the data if there are errors and use default
    // config. Otherwise, we may return an object that does not conform to
    // TypeSpecConfig's typing.
    data = deepClone(defaultConfig) as TypeSpecRawConfig;
  }

  const emit = data.emit;
  const options = data.options;

  return omitUndefined({
    projectRoot: getDirectoryPath(filename),
    file: yamlScript,
    filename,
    diagnostics,
    extends: data.extends,
    environmentVariables: data["environment-variables"],
    parameters: data.parameters,
    outputDir: data["output-dir"] ?? "{cwd}/tsp-output",
    warnAsError: data["warn-as-error"],
    imports: data.imports,
    trace: typeof data.trace === "string" ? [data.trace] : data.trace,
    emit,
    options,
    linter: data.linter,
  });
}

export function validateConfigPathsAbsolute(config: TypeSpecConfig): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];

  function checkPath(value: string | undefined, path: string[]) {
    if (value === undefined) {
      return;
    }
    const diagnostic = validatePathAbsolute(
      value,
      config.file ? { file: config.file, path } : NoTarget
    );
    if (diagnostic) {
      diagnostics.push(diagnostic);
    }
  }

  checkPath(config.outputDir, ["output-dir"]);
  for (const [emitterName, emitterOptions] of Object.entries(config.options ?? {})) {
    checkPath(emitterOptions["emitter-output-dir"], ["options", emitterName, "emitter-output-dir"]);
  }
  return diagnostics;
}

function validatePathAbsolute(
  path: string,
  target: { file: YamlScript; path: string[] } | typeof NoTarget
): Diagnostic | undefined {
  if (path.startsWith(".") || !isPathAbsolute(path)) {
    return createDiagnostic({
      code: "config-path-absolute",
      format: { path },
      target: target === NoTarget ? target : getLocationInYamlScript(target.file, target.path),
    });
  }
  if (path.includes("\\")) {
    return createDiagnostic({
      code: "path-unix-style",
      format: { path },
      target: target === NoTarget ? target : getLocationInYamlScript(target.file, target.path),
    });
  }

  return undefined;
}
