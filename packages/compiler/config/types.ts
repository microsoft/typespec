import { Diagnostic } from "../core";

/**
 * Represent the normalized user configuration.
 */
export interface CadlConfig {
  /**
   * Project root.
   */
  projectRoot: string;

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
   * Environment variables configuration
   */
  environmentVariables?: Record<string, ConfigEnvironmentVariable>;

  /**
   * Parameters that can be used
   */
  parameters?: Record<string, ConfigParameter>;

  /**
   * Treat warning as error.
   */
  warnAsError?: boolean;

  /**
   * Output directory
   */
  outputDir: string;

  /**
   * Trace options.
   */
  trace?: string[];

  /**
   * Additional imports.
   */
  imports?: string[];

  /**
   * Name of emitters or path to emitters that should be used.
   */
  emit?: string[];

  /**
   * Name of emitters or path to emitters that should be used.
   */
  options?: Record<string, EmitterOptions>;
}

/**
 * Represent the configuration that can be provided in a config file.
 */
export interface CadlRawConfig {
  extends?: string;
  "environment-variables"?: Record<string, ConfigEnvironmentVariable>;
  parameters?: Record<string, ConfigParameter>;

  "warn-as-error"?: boolean;
  "output-dir"?: string;
  trace?: string | string[];
  imports?: string[];

  emit?: string[];
  options?: Record<string, EmitterOptions>;
  emitters?: Record<string, boolean | EmitterOptions>;
}

export interface ConfigEnvironmentVariable {
  default: string;
}

export interface ConfigParameter {
  default: string;
}

export type EmitterOptions = Record<string, unknown> & {
  "emitter-output-dir"?: string;
};
