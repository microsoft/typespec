import type { CompilerOptions, LinterRuleSet } from "@typespec/compiler";
import { isMap, parse, parseDocument, stringify } from "yaml";

export interface TspConfig {
  emit?: string[];
  options?: Record<string, Record<string, unknown>>;
  linter?: LinterRuleSet;
  imports?: string[];
  trace?: string | string[];
  "warn-as-error"?: boolean;
  "output-dir"?: string;
}

function hasLinterRules(linterRuleSet: LinterRuleSet | undefined): boolean {
  if (!linterRuleSet) return false;
  return Boolean(
    (linterRuleSet.extends && linterRuleSet.extends.length > 0) ||
    (linterRuleSet.enable && Object.keys(linterRuleSet.enable).length > 0) ||
    (linterRuleSet.disable && Object.keys(linterRuleSet.disable).length > 0),
  );
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

  if (hasLinterRules(compilerOptions.linterRuleSet)) {
    config.linter = compilerOptions.linterRuleSet;
  }

  return stringify(config, { indent: 2 }) || "";
}

/**
 * Update an existing tspconfig.yaml with structured changes coming from the visual form
 * (emitter + compiler options) while preserving comments and any other fields the form
 * doesn't manage (e.g. `output-dir`, `warn-as-error`, `imports`).
 */
export function updateTspConfigYaml(
  existingYaml: string,
  selectedEmitter: string,
  compilerOptions: CompilerOptions,
): string {
  let doc;
  try {
    doc = parseDocument(existingYaml ?? "");
  } catch {
    return compilerOptionsToTspConfig(selectedEmitter, compilerOptions);
  }

  // If the existing content isn't a clean mapping (empty/invalid), rebuild from scratch.
  if (doc.errors.length > 0 || !isMap(doc.contents)) {
    return compilerOptionsToTspConfig(selectedEmitter, compilerOptions);
  }

  if (selectedEmitter) {
    doc.setIn(["emit"], [selectedEmitter]);
  } else {
    doc.deleteIn(["emit"]);
  }

  if (compilerOptions.options && Object.keys(compilerOptions.options).length > 0) {
    doc.setIn(["options"], compilerOptions.options);
  } else {
    doc.deleteIn(["options"]);
  }

  if (hasLinterRules(compilerOptions.linterRuleSet)) {
    doc.setIn(["linter"], compilerOptions.linterRuleSet);
  } else {
    doc.deleteIn(["linter"]);
  }

  return doc.toString();
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
