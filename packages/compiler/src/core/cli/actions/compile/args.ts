import { expandConfigVariables } from "../../../../config/config-interpolation.js";
import {
  loadTypeSpecConfigForPath,
  validateConfigPathsAbsolute,
} from "../../../../config/config-loader.js";
import { EmitterOptions, TypeSpecConfig } from "../../../../config/types.js";
import { createDiagnosticCollector } from "../../../index.js";
import { CompilerOptions } from "../../../options.js";
import { getDirectoryPath, normalizePath, resolvePath } from "../../../path-utils.js";
import { CompilerHost, Diagnostic } from "../../../types.js";
import { deepClone, omitUndefined } from "../../../util.js";

export interface CompileCliArgs {
  "output-dir"?: string;
  "output-path"?: string;
  nostdlib?: boolean;
  options?: string[];
  import?: string[];
  watch?: boolean;
  emit?: string[];
  trace?: string[];
  debug?: boolean;
  config?: string;
  "warn-as-error"?: boolean;
  "no-emit"?: boolean;
  args?: string[];
}

export async function getCompilerOptions(
  host: CompilerHost,
  entrypoint: string,
  cwd: string,
  args: CompileCliArgs,
  env: Record<string, string | undefined>
): Promise<[CompilerOptions | undefined, readonly Diagnostic[]]> {
  cwd = normalizePath(cwd);

  const diagnostics = createDiagnosticCollector();
  const pathArg = args["output-dir"] ?? args["output-path"];
  const configPath = args["config"]
    ? resolvePath(cwd, args["config"])
    : getDirectoryPath(entrypoint);

  const config = await loadTypeSpecConfigForPath(host, configPath, "config" in args);
  if (config.diagnostics.length > 0) {
    if (config.diagnostics.some((d) => d.severity === "error")) {
      return [undefined, config.diagnostics];
    }
    config.diagnostics.forEach((x) => diagnostics.add(x));
  }

  const cliOptions = resolveCliOptions(args);

  const configWithCliArgs: TypeSpecConfig = {
    ...config,
    outputDir: config.outputDir,
    imports: args["import"] ?? config["imports"],
    warnAsError: args["warn-as-error"] ?? config.warnAsError,
    trace: args.trace ?? config.trace,
    emit: args.emit ?? config.emit,
    options: resolveEmitterOptions(config, cliOptions),
  };
  const cliOutputDir = pathArg ? resolvePath(cwd, pathArg) : undefined;

  const expandedConfig = diagnostics.pipe(
    expandConfigVariables(configWithCliArgs, {
      cwd: cwd,
      outputDir: cliOutputDir,
      env,
      args: resolveConfigArgs(args),
    })
  );
  validateConfigPathsAbsolute(expandedConfig).forEach((x) => diagnostics.add(x));

  const options: CompilerOptions = omitUndefined({
    nostdlib: args["nostdlib"],
    watchForChanges: args["watch"],
    noEmit: args["no-emit"],
    miscOptions: cliOptions.miscOptions,
    outputDir: expandedConfig.outputDir,
    config: config.filename,
    additionalImports: expandedConfig["imports"],
    warningAsError: expandedConfig.warnAsError,
    trace: expandedConfig.trace,
    emit: expandedConfig.emit,
    options: expandedConfig.options,
    linterRuleSet: expandedConfig.linter,
  });
  return diagnostics.wrap(options);
}

function resolveConfigArgs(args: CompileCliArgs): Record<string, string> {
  const map: Record<string, string> = {};
  for (const arg of args.args ?? []) {
    const optionParts = arg.split("=");
    if (optionParts.length !== 2) {
      throw new Error(`The --arg parameter value "${arg}" must be in the format: arg-name=value`);
    }

    map[optionParts[0]] = optionParts[1];
  }

  return map;
}
function resolveCliOptions(
  args: CompileCliArgs
): Record<string | "miscOptions", Record<string, unknown>> {
  const options: Record<string, Record<string, string>> = {};
  for (const option of args.options ?? []) {
    const optionParts = option.split("=");
    if (optionParts.length !== 2) {
      throw new Error(
        `The --option parameter value "${option}" must be in the format: <emitterName>.some-options=value`
      );
    }
    let optionKeyParts = optionParts[0].split(".");
    if (optionKeyParts.length === 1) {
      const key = optionKeyParts[0];
      if (!("miscOptions" in options)) {
        options.miscOptions = {};
      }
      options.miscOptions[key] = optionParts[1];
      continue;
    } else if (optionKeyParts.length > 2) {
      // support emitter/path/file.js.option=xyz
      optionKeyParts = [
        optionKeyParts.slice(0, -1).join("."),
        optionKeyParts[optionKeyParts.length - 1],
      ];
    }
    const emitterName = optionKeyParts[0];
    const key = optionKeyParts[1];
    if (!(emitterName in options)) {
      options[emitterName] = {};
    }
    options[emitterName][key] = optionParts[1];
  }
  return options;
}

function resolveEmitterOptions(
  config: TypeSpecConfig,
  cliOptions: Record<string | "miscOptions", Record<string, unknown>>
): Record<string, EmitterOptions> {
  const configuredEmitters: Record<string, Record<string, unknown>> = deepClone(
    config.options ?? {}
  );

  for (const [emitterName, cliOptionOverride] of Object.entries(cliOptions)) {
    if (emitterName === "miscOptions") {
      continue;
    }
    configuredEmitters[emitterName] = {
      ...(configuredEmitters[emitterName] ?? {}),
      ...cliOptionOverride,
    };
  }

  return configuredEmitters;
}
