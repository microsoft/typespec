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

  /**
   * Path to another cadl config to extend.
   */
  extends?: string;

  emitters: Record<string, boolean>;
}

export type RuleValue = "on" | "off" | {};

/**
 * Represent the configuration that can be provided in a config file.
 */
export interface CadlRawConfig {
  extends?: string;
  emitters?: Record<string, boolean>;
}
