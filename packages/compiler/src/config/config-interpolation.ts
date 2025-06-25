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
  const resolvingValues = new Set<string>();

  function resolveValuePath(obj: any, path: string[]): any {
    return path.reduce((acc, key) => (acc && typeof acc === "object" ? acc[key] : undefined), obj);
  }

  function resolveValue(keys: string[]): unknown {
    const keyPath = keys.join(".");
    resolvingValues.add(keyPath);
    let value: any = resolveValuePath(values, keys);
    if (typeof value !== "string") {
      if (hasNestedValues(value)) {
        value = value as Record<string, any>;
        const resultObject: Record<string, any> = {};
        for (const [nestedKey] of Object.entries(value)) {
          resultObject[nestedKey] = resolveValue(keys.concat(nestedKey)) as any;
        }
        resolvingValues.delete(keyPath);
        return resultObject;
      }
      resolvingValues.delete(keyPath);
      return value;
    }
    const replaced = value.replace(VariableInterpolationRegex, (_, expression) => {
      return (resolveExpression(expression) as string) ?? `{${expression}}`;
    });
    resolvingValues.delete(keyPath);
    return replaced;
  }

  function resolveExpression(expression: string): unknown | undefined {
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
    const segments = expression.split(".");
    return resolveValue(segments) ?? resolveValuePath(predefinedVariables, segments);
  }

  for (const key of Object.keys(values)) {
    if (key in resolvedValues) {
      continue;
    }
    resolvedValues[key] = resolveValue([key]) as any;
  }

  return [resolvedValues as any, diagnostics];
}
