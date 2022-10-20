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

  /**
   * Treat warning as error.
   */
  warnAsError?: boolean;
  /**
   * Output directory
   */
  outputDir?: string;

  /**
   * Trace options.
   */
  trace?: string[];

  /**
   * Additional imports.
   */
  imports?: string[];

  /**
   * Emitter configuration
   */
  emitters: Record<string, boolean | Record<string, unknown>>;
}

export type RuleValue = "on" | "off" | Record<string, unknown>;

/**
 * Represent the configuration that can be provided in a config file.
 */
export interface CadlRawConfig {
  extends?: string;
  "warn-as-error"?: boolean;
  "output-dir"?: string;
  trace?: string | string[];
  imports?: string[];
  emitters?: Record<string, boolean | Record<string, unknown>>;
}
