import { CadlConfig, ConfigEnvironmentVariable, ConfigParameter } from "./types.js";

export interface ExpandConfigOptions {
  readonly outputDir?: string;
  readonly env?: Record<string, string | undefined>;
  readonly args?: Record<string, string>;
}

export function expandConfigVariables(
  config: CadlConfig,
  options: ExpandConfigOptions
): CadlConfig {
  const commonVars = {
    "project-root": config.projectRoot,
    cwd: process.cwd(),
    ...resolveArgs(config.parameters, options.args),
    env: resolveArgs(config.environmentVariables, options.env),
  };
  const outputDir = resolveConfigValue(config.outputDir ?? options.outputDir, commonVars);

  const emitters: Record<string, Record<string, unknown>> = {};

  for (const [name, emitterOptions] of Object.entries(config.emitters)) {
    const emitterVars = { ...commonVars, "output-dir": outputDir, "emitter-name": name };
    emitters[name] = {};
    for (const [key, value] of Object.entries(emitterOptions)) {
      if (typeof value === "string") {
        emitters[name][key] = resolveConfigValue(value, emitterVars);
      } else {
        emitters[name][key] = value;
      }
    }
  }

  return { ...config, outputDir };
}

function resolveArgs(
  declarations: Record<string, ConfigParameter | ConfigEnvironmentVariable> | undefined,
  args: Record<string, string | undefined> | undefined
): Record<string, string> {
  if (declarations === undefined) {
    return {};
  }
  const env: Record<string, string> = {};
  for (const [name, definition] of Object.entries(declarations)) {
    env[name] = args?.[name] ?? definition.default;
  }
  return env;
}
function resolveConfigValue(
  value: string,
  variables: Record<string, string | Record<string, string>>
) {
  return value.replace(/{([a-zA-Z.]+)}/g, (match, variable) => {
    const segments = variable.split(".");
    let resolved: any = variables;
    for (const segment of segments) {
      resolved = resolved[segment];
      if (resolved === undefined) {
        return `{${variable}}`;
      }
    }

    if (typeof resolved === "string") {
      return resolved;
    } else {
      return `{${variable}}`;
    }
  });
}
