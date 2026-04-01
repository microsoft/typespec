import type { Diagnostic, RuleRef } from "../core/types.js";
import type { YamlScript } from "../yaml/types.js";

/**
 * Resolved project configuration for a project boundary.
 */
export interface TypeSpecProjectConfig {
  /**
   * Resolved absolute path to the entrypoint file.
   */
  entrypoint: string;
}

/**
 * Raw project configuration as provided in tspconfig.yaml.
 * Can be `true` (shorthand for all defaults) or an object with explicit settings.
 */
export type TypeSpecRawProjectConfig =
  | true
  | {
      /**
       * Main TypeSpec file for this project, relative to config directory.
       * @default "main.tsp"
       */
      entrypoint?: string;
    };

/**
 * Represent the normalized user configuration.
 */
export interface TypeSpecConfig {
  /**
   * Project root.
   */
  projectRoot: string;

  /** Yaml file used in this configuration. */
  file?: YamlScript;

  /**
   * Path to the config file used to create this configuration.
   */
  filename?: string;

  /**
   * Diagnostics reported while loading the configuration
   */
  diagnostics: Diagnostic[];

  /**
   * Path to another TypeSpec config to extend.
   */
  extends?: string;

  /**
   * Resolved project configuration.
   * When present, this config defines a project boundary and the directory
   * containing this file is the project root.
   */
  project?: TypeSpecProjectConfig;

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

  /**
   * Marks this configuration as a project boundary.
   * When present, the directory containing this file is the project root.
   */
  project?: TypeSpecRawProjectConfig;

  "environment-variables"?: Record<string, ConfigEnvironmentVariable>;
  parameters?: Record<string, ConfigParameter>;

  "warn-as-error"?: boolean;
  "output-dir"?: string;
  trace?: string | string[];
  imports?: string[];

  emit?: string[];
  options?: Record<string, EmitterOptions>;

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
