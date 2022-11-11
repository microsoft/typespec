import { createDiagnosticCollector, ignoreDiagnostics } from "../core/diagnostics.js";
import { createDiagnostic } from "../core/messages.js";
import { Diagnostic, NoTarget } from "../core/types.js";
import { CadlConfig, ConfigEnvironmentVariable, ConfigParameter } from "./types.js";

export interface ExpandConfigOptions {
  readonly cwd: string;
  readonly outputDir?: string;
  readonly env?: Record<string, string | undefined>;
  readonly args?: Record<string, string>;
}

export function expandConfigVariables(
  config: CadlConfig,
  options: ExpandConfigOptions
): [CadlConfig, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const builtInVars = {
    "project-root": config.projectRoot,
    cwd: options.cwd,
  };

  const commonVars = {
    ...builtInVars,
    ...resolveArgs(config.parameters, options.args, builtInVars),
    env: resolveArgs(config.environmentVariables, options.env, builtInVars),
  };
  const outputDir = diagnostics.pipe(
    resolveValue(options.outputDir ?? config.outputDir, commonVars)
  );

  const emitters: Record<string, Record<string, unknown>> = {};

  for (const [name, emitterOptions] of Object.entries(config.emitters)) {
    const emitterVars = { ...commonVars, "output-dir": outputDir, "emitter-name": name };
    emitters[name] = diagnostics.pipe(resolveValues(emitterOptions, emitterVars));
  }

  return diagnostics.wrap({ ...config, outputDir, emitters });
}

function resolveArgs(
  declarations: Record<string, ConfigParameter | ConfigEnvironmentVariable> | undefined,
  args: Record<string, string | undefined> | undefined,
  predefinedVariables: Record<string, string | Record<string, string>>
): Record<string, string> {
  if (declarations === undefined) {
    return {};
  }
  const env: Record<string, string> = {};
  for (const [name, definition] of Object.entries(declarations)) {
    env[name] =
      args?.[name] ?? ignoreDiagnostics(resolveValue(definition.default, predefinedVariables));
  }
  return env;
}

const VariableInterpolationRegex = /{([a-zA-Z-_.]+)}/g;

function resolveValue(
  value: string,
  predefinedVariables: Record<string, string | Record<string, string>>
): [string, readonly Diagnostic[]] {
  const [result, diagnostics] = resolveValues({ value }, predefinedVariables);
  return [result.value, diagnostics];
}

export function resolveValues<T extends Record<string, unknown>>(
  values: T,
  predefinedVariables: Record<string, string | Record<string, string>> = {}
): [T, readonly Diagnostic[]] {
  const diagnostics: Diagnostic[] = [];
  const resolvedValues: Record<string, unknown> = {};
  const resolvingValues = new Set<string>();

  function resolveValue(key: string) {
    resolvingValues.add(key);
    const value = values[key];
    if (!(typeof value === "string")) {
      return value;
    }
    return value.replace(VariableInterpolationRegex, (match, expression) => {
      return (resolveExpression(expression) as string) ?? `{${expression}}`;
    });
  }

  function resolveExpression(expression: string): unknown | undefined {
    if (expression in resolvedValues) {
      return resolvedValues[expression];
    }

    if (resolvingValues.has(expression)) {
      diagnostics.push(
        createDiagnostic({
          code: "circular-config-variable",
          target: NoTarget,
          format: { name: expression },
        })
      );
      return undefined;
    }

    if (expression in values) {
      return resolveValue(expression) as any;
    }

    const segments = expression.split(".");
    let resolved: any = predefinedVariables;
    for (const segment of segments) {
      resolved = resolved[segment];
      if (resolved === undefined) {
        return undefined;
      }
    }

    if (typeof resolved === "string") {
      return resolved;
    } else {
      return undefined;
    }
  }

  for (const key of Object.keys(values)) {
    resolvingValues.clear();
    if (key in resolvedValues) {
      continue;
    }

    resolvedValues[key] = resolveValue(key) as any;
  }

  return [resolvedValues as any, diagnostics];
}
