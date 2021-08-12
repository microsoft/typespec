import { Diagnostic } from "../core";

/**
 * Represent the normalized user configuration.
 */
export interface CadlConfig {
  /**
   * Path to the config file used to create this configuration.
   */
  filename?: string;

  /**
   * Diagnostics reported while loading the configuration
   */
  diagnostics: Diagnostic[];

  plugins: string[];
  lint: CadlLintConfig;
  emitters: Record<string, boolean>;
}

export type RuleValue = "on" | "off" | {};

export interface CadlLintConfig {
  extends: string[];
  rules: Record<string, RuleValue>;
}

/**
 * Represent the configuration that can be provided in a config file.
 */
export interface CadlRawConfig {
  plugins?: string[];
  lint?: Partial<CadlLintConfig>;
  emitters?: Record<string, boolean>;
}
