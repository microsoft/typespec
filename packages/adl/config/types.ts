import { Diagnostic } from "../compiler";

/**
 * Represent the normalized user configuration.
 */
export interface ADLConfig {
  /**
   * Path to the config file used to create this configuration.
   */
  filename?: string;

  /**
   * Diagnostics reported while loading the configuration
   */
  diagnostics: Diagnostic[];

  plugins: string[];
  lint: ADLLintConfig;
  emitters: Record<string, boolean>;
}

export type RuleValue = "on" | "off" | {};

export interface ADLLintConfig {
  extends: string[];
  rules: Record<string, RuleValue>;
}

/**
 * Represent the configuration that can be provided in a config file.
 */
export interface ADLRawConfig {
  plugins?: string[];
  lint?: Partial<ADLLintConfig>;
  emitters?: Record<string, boolean>;
}
