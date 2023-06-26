import { Diagnostic, RuleRef } from "../core/index.js";

/**
 * Represent the normalized user configuration.
 */
export interface TypeSpecConfig {
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
   * Path to another typespec config to extend.
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

  linter?: LinterConfig;
}

/**
 * Represent the configuration that can be provided in a config file.
 */
export interface TypeSpecRawConfig {
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

  linter?: LinterConfig;
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

export interface LinterConfig {
  extends?: RuleRef[];
  enable?: Record<RuleRef, boolean>;
  disable?: Record<RuleRef, string>;
}
