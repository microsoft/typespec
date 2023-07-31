import { createDiagnostic } from "../core/messages.js";
import { getDirectoryPath, isPathAbsolute, joinPaths, resolvePath } from "../core/path-utils.js";
import { createJSONSchemaValidator } from "../core/schema-validator.js";
import { CompilerHost, Diagnostic, NoTarget, SourceFile } from "../core/types.js";
import { deepClone, deepFreeze, doIO, omitUndefined } from "../core/util.js";
import { createSourceFile } from "../index.js";
import { YamlScript } from "../yaml/types.js";
import { parseYaml } from "../yaml/yaml-parser.js";
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
  path: string
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
 * Load the typespec configuration for the provided path or directory
 * @param host
 * @param path
 */
export async function loadTypeSpecConfigForPath(
  host: CompilerHost,
  path: string,
  errorIfNotFound: boolean = false
): Promise<TypeSpecConfig> {
  const typespecConfigPath = await findTypeSpecConfigPath(host, path);
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
    diagnostics = diagnostics.concat(configValidator.validate(data, file));
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
