import { createDiagnosticCollector, ignoreDiagnostics } from "../core/diagnostics.js";
import { createDiagnostic } from "../core/messages.js";
import { Diagnostic, NoTarget } from "../core/types.js";
import {
  ConfigEnvironmentVariable,
  ConfigParameter,
  EmitterOptions,
  TypeSpecConfig,
} from "./types.js";

export interface ExpandConfigOptions {
  readonly cwd: string;
  readonly outputDir?: string;
  readonly env?: Record<string, string | undefined>;
  readonly args?: Record<string, string>;
}

export function expandConfigVariables(
  config: TypeSpecConfig,
  expandOptions: ExpandConfigOptions,
): [TypeSpecConfig, readonly Diagnostic[]] {
  const diagnostics = createDiagnosticCollector();
  const builtInVars = {
    "project-root": config.projectRoot,
    cwd: expandOptions.cwd,
  };

  const commonVars = {
    ...builtInVars,
    ...diagnostics.pipe(resolveArgs(config.parameters, expandOptions.args, builtInVars)),
    env: diagnostics.pipe(
      resolveArgs(config.environmentVariables, expandOptions.env, builtInVars, true),
    ),
  };
  const outputDir = diagnostics.pipe(
    resolveValue(expandOptions.outputDir ?? config.outputDir, commonVars),
  );

  const result = { ...config, outputDir };
  if (config.options) {
    const options: Record<string, EmitterOptions> = {};
    for (const [name, emitterOptions] of Object.entries(config.options)) {
      const emitterVars = { ...commonVars, "output-dir": outputDir, "emitter-name": name };
      options[name] = diagnostics.pipe(resolveValues(emitterOptions, emitterVars));
    }
    result.options = options;
  }

  return diagnostics.wrap(result);
}

function resolveArgs(
  declarations: Record<string, ConfigParameter | ConfigEnvironmentVariable> | undefined,
  args: Record<string, string | undefined> | undefined,
  predefinedVariables: Record<string, string | Record<string, string>>,
  allowUnspecified = false,
): [Record<string, string>, readonly Diagnostic[]] {
  const unmatchedArgs = new Set(Object.keys(args ?? {}));
  const result: Record<string, string> = {};
  if (declarations !== undefined) {
    for (const [name, definition] of Object.entries(declarations)) {
      unmatchedArgs.delete(name);
      result[name] = ignoreDiagnostics(
        resolveValue(args?.[name] ?? definition.default, predefinedVariables),
      );
    }
  }

  if (!allowUnspecified) {
    const diagnostics: Diagnostic[] = [...unmatchedArgs].map((unmatchedArg) => {
      return createDiagnostic({
        code: "config-invalid-argument",
        format: { name: unmatchedArg },
        target: NoTarget,
      });
    });
    return [result, diagnostics];
  }
  return [result, []];
}

const VariableInterpolationRegex = /{([a-zA-Z-_.]+)}/g;

function resolveValue(
  value: string,
  predefinedVariables: Record<string, string | Record<string, string>>,
): [string, readonly Diagnostic[]] {
  const [result, diagnostics] = resolveValues({ value }, predefinedVariables);
  return [result.value, diagnostics];
}

export function resolveValues<T extends Record<string, unknown>>(
  values: T,
  predefinedVariables: Record<string, string | Record<string, string>> = {},
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
          code: "config-circular-variable",
          target: NoTarget,
          format: { name: expression },
        }),
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
