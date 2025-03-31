import { createDiagnosticCollector } from "../core/diagnostics.js";
import { createDiagnostic } from "../core/messages.js";
import { CompilerOptions } from "../core/options.js";
import { getDirectoryPath, normalizePath } from "../core/path-utils.js";
import { CompilerHost, Diagnostic, NoTarget } from "../core/types.js";
import { doIO } from "../utils/io.js";
import { deepClone, omitUndefined } from "../utils/misc.js";
import { expandConfigVariables } from "./config-interpolation.js";
import { loadTypeSpecConfigForPath, validateConfigPathsAbsolute } from "./config-loader.js";
import { EmitterOptions, TypeSpecConfig } from "./types.js";

export interface ResolveCompilerOptionsOptions extends ConfigToOptionsOptions {
  /** Absolute entrypoint path */
  entrypoint: string;

  /** Explicit config path. */
  configPath?: string;
}

export interface ConfigToOptionsOptions {
  /**
   * Current working directory. This will be used to interpolate `{cwd}` in the config.
   */
  cwd: string;

  /**
   * Environment variables.
   */
  env?: Record<string, string | undefined>;

  /**
   * Any arguments to interpolate the config.
   */
  args?: Record<string, string>;

  /** Compiler options to override the config */
  overrides?: Partial<TypeSpecConfig>;
}

/**
 * Resolve the compiler options for the given entrypoint by resolving the tspconfig.yaml.
 * @param host Compiler host
 * @param options
 */
export async function resolveCompilerOptions(
  host: CompilerHost,
  options: ResolveCompilerOptionsOptions,
): Promise<[CompilerOptions, readonly Diagnostic[]]> {
  const diagnostics = createDiagnosticCollector();

  const entrypointStat = await doIO(
    host.stat,
    options.entrypoint,
    (diag) => diagnostics.add(diag),
    { allowFileNotFound: true },
  );
  const configPath =
    options.configPath ??
    (entrypointStat?.isDirectory() ? options.entrypoint : getDirectoryPath(options.entrypoint));
  const config = await loadTypeSpecConfigForPath(
    host,
    configPath,
    options.configPath !== undefined,
    options.configPath === undefined,
  );
  config.diagnostics.forEach((x) => diagnostics.add(x));

  const compilerOptions = diagnostics.pipe(resolveOptionsFromConfig(config, options));
  return diagnostics.wrap(compilerOptions);
}

/**
 * Resolve the compiler options from the given raw TypeSpec config
 * @param config TypeSpec config.
 * @param options Options for interpolation in the config.
 * @returns
 */
export function resolveOptionsFromConfig(config: TypeSpecConfig, options: ConfigToOptionsOptions) {
  const cwd = normalizePath(options.cwd);
  const diagnostics = createDiagnosticCollector();

  validateConfigNames(config).forEach((x) => diagnostics.add(x));
  const configWithOverrides: TypeSpecConfig = {
    ...config,
    ...options.overrides,
    options: mergeOptions(config.options, options.overrides?.options),
  };
  const expandedConfig = diagnostics.pipe(
    expandConfigVariables(configWithOverrides, {
      cwd,
      outputDir: options.overrides?.outputDir,
      env: options.env ?? {},
      args: options.args,
    }),
  );
  validateConfigPathsAbsolute(expandedConfig).forEach((x) => diagnostics.add(x));

  const resolvedOptions: CompilerOptions = omitUndefined({
    outputDir: expandedConfig.outputDir,
    config: config.filename,
    configFile: config,
    additionalImports: expandedConfig["imports"],
    warningAsError: expandedConfig.warnAsError,
    trace: expandedConfig.trace,
    emit: expandedConfig.emit,
    options: expandedConfig.options,
    linterRuleSet: expandedConfig.linter,
  });
  return diagnostics.wrap(resolvedOptions);
}

export function validateConfigNames(config: TypeSpecConfig): readonly Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  function checkName(name: string) {
    if (name.includes(".")) {
      diagnostics.push(
        createDiagnostic({
          code: "config-invalid-name",
          format: { name },
          target: NoTarget,
        }),
      );
    }
  }

  function validateNamesRecursively(obj: any) {
    for (const [key, value] of Object.entries(obj ?? {})) {
      checkName(key);
      if (hasNestedObjects(value)) {
        validateNamesRecursively(value);
      }
    }
  }

  validateNamesRecursively(config.options);
  validateNamesRecursively(config.parameters);
  return diagnostics;
}

function mergeOptions(
  base: Record<string, Record<string, unknown>> | undefined,
  overrides: Record<string, Record<string, unknown>> | undefined,
): Record<string, EmitterOptions> {
  const configuredEmitters: Record<string, Record<string, unknown>> = deepClone(base ?? {});
  function isObject(item: unknown): item is Record<string, unknown> {
    return item && typeof item === "object" && (!Array.isArray(item) as any);
  }
  function deepMerge(target: any, source: any): any {
    if (isObject(target) && isObject(source)) {
      for (const key in source) {
        if (isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          deepMerge(target[key], source[key]);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return target;
  }

  for (const [emitterName, cliOptionOverride] of Object.entries(overrides ?? {})) {
    configuredEmitters[emitterName] = deepMerge(
      configuredEmitters[emitterName] ?? {},
      cliOptionOverride,
    );
  }

  return configuredEmitters;
}

function hasNestedObjects(value: any): boolean {
  return value && typeof value === "object" && !Array.isArray(value);
}
