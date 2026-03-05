import type { CompilerOptions, LinterRuleSet } from "@typespec/compiler";
import { parse, stringify } from "yaml";

export interface TspConfig {
  emit?: string[];
  options?: Record<string, Record<string, unknown>>;
  linter?: LinterRuleSet;
  imports?: string[];
  trace?: string | string[];
  "warn-as-error"?: boolean;
  "output-dir"?: string;
}

/**
 * Serialize the current playground state (emitter + compiler options) to tspconfig.yaml content.
 */
export function compilerOptionsToTspConfig(
  selectedEmitter: string,
  compilerOptions: CompilerOptions,
): string {
  const config: TspConfig = {};

  if (selectedEmitter) {
    config.emit = [selectedEmitter];
  }

  if (compilerOptions.options && Object.keys(compilerOptions.options).length > 0) {
    config.options = compilerOptions.options;
  }

  if (compilerOptions.linterRuleSet) {
    config.linter = compilerOptions.linterRuleSet;
  }

  return stringify(config, { indent: 2 }) || "";
}

export interface ParsedTspConfig {
  selectedEmitter?: string;
  compilerOptions: CompilerOptions;
}

/**
 * Parse tspconfig.yaml content back to playground state.
 * Returns undefined if the YAML is invalid.
 */
export function parseTspConfigYaml(yamlContent: string): ParsedTspConfig | undefined {
  try {
    const config = parse(yamlContent) as TspConfig | null;
    if (!config || typeof config !== "object") {
      return { compilerOptions: {} };
    }

    const compilerOptions: CompilerOptions = {};

    if (config.options) {
      compilerOptions.options = config.options;
    }

    if (config.linter) {
      compilerOptions.linterRuleSet = config.linter;
    }

    const selectedEmitter = config.emit?.[0];

    return { selectedEmitter, compilerOptions };
  } catch {
    return undefined;
  }
}
