import { createDiagnosticCollector } from "../core/diagnostics.js";
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

  const resolvedArgsParameters = diagnostics.pipe(
    resolveArgs(config.parameters, expandOptions.args),
  );
  const commonVars = {
    ...builtInVars,
    ...resolvedArgsParameters,
    env: diagnostics.pipe(resolveArgs(config.environmentVariables, expandOptions.env, true)),
    "output-dir": expandOptions.outputDir ?? config.outputDir ?? "{cwd}/tsp-output",
  };
  const resolvedCommonVars = diagnostics.pipe(resolveValues(commonVars));
  console.log("Resolved common variables:", resolvedCommonVars);
  const outputDir = resolvedCommonVars["output-dir"];
  const result = { ...config, outputDir };
  if (config.options) {
    const options: Record<string, EmitterOptions> = {};
    for (const [name, emitterOptions] of Object.entries(config.options)) {
      const emitterVars = { ...resolvedCommonVars, "output-dir": outputDir, "emitter-name": name };
      options[name] = diagnostics.pipe(resolveValues(emitterOptions, emitterVars));
    }
    result.options = options;
  }

  return diagnostics.wrap(result);
}

function resolveArgs(
  declarations: Record<string, ConfigParameter | ConfigEnvironmentVariable> | undefined,
  args: Record<string, string | undefined> | undefined,
  allowUnspecified = false,
): [Record<string, string>, readonly Diagnostic[]] {
  const unmatchedArgs = new Set(Object.keys(args ?? {}));
  const result: Record<string, string> = {};

  if (declarations !== undefined) {
    for (const [name, definition] of Object.entries(declarations)) {
      unmatchedArgs.delete(name);
      result[name] = args?.[name] ?? definition.default;
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

function hasNestedValues(value: any): boolean {
  return (
    value && typeof value === "object" && !Array.isArray(value) && Object.keys(value).length > 0
  );
}

const VariableInterpolationRegex = /{([a-zA-Z-_.]+)}/g;

export function resolveValues<T extends Record<string, unknown>>(
  values: T,
  predefinedVariables: Record<string, string | Record<string, string>> = {},
): [T, readonly Diagnostic[]] {
  const diagnostics: Diagnostic[] = [];
  const resolvedValues: Record<string, unknown> = {};
  const resolvedExpressions: Record<string, unknown> = {};
  const resolvingValues = new Set<string>();

  function resolveValue(keys: string[]): unknown {
    console.log("Resolving", keys);
    resolvingValues.add(keys[0]);
    let value: any = values;
    value = keys.reduce((acc, key) => acc?.[key], value);
    console.log("Resolved value", value);
    if (typeof value !== "string") {
      if (hasNestedValues(value)) {
        value = value as Record<string, any>;
        const resultObject: Record<string, any> = {};
        for (const [nestedKey] of Object.entries(value)) {
          resolvingValues.add(nestedKey);
          resultObject[nestedKey] = resolveValue(keys.concat(nestedKey)) as any;
        }
        return resultObject;
      }
      return value;
    }
    return value.replace(VariableInterpolationRegex, (_, expression) => {
      return (resolveExpression(expression) as string) ?? `{${expression}}`;
    });
  }

  function resolveExpression(expression: string): unknown | undefined {
    console.log("Resolving expression", expression, resolvedValues);
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
      return resolveValue([expression]) as any;
    }

    let resolved: any = predefinedVariables;
    if (expression in resolved) {
      return resolved[expression];
    }

    const segments = expression.split(".");
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
    resolvedValues[key] = resolveValue([key]) as any;
  }

  return [resolvedValues as any, diagnostics];
}
