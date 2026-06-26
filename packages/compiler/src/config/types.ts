import type { Diagnostic, LinterRuleEnableValue, RuleRef } from "../core/types.js";
import type { YamlScript } from "../yaml/types.js";

/**
 * Represent the normalized user configuration.
 */
export interface TypeSpecConfig {
  /**
   * Project root.
   */
  projectRoot: string;

  /**
   * Kind of the config. When set to "project", this config marks a project boundary.
   */
  kind?: "project";

  /**
   * Main TypeSpec file for this project, relative to the config directory.
   * Only meaningful when `kind` is `"project"`. Defaults to `"main.tsp"`.
   */
  entrypoint?: string;

  /**
   * Compiler features enabled for this project.
   * Only meaningful when `kind` is `"project"`.
   */
  features?: string[];

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

  /**
   * Permissions granted to emitters/libraries when running in the sandbox.
   * Keyed by the emitter/library name (matching its package name). By default
   * an emitter/library is granted nothing and cannot access any system API.
   */
  permissions?: Record<string, ConfigPermissionGrant>;

  linter?: LinterConfig;
}

/**
 * Represent the configuration that can be provided in a config file.
 */
export interface TypeSpecRawConfig {
  extends?: string;

  /**
   * Kind of the config. When set to "project", this config marks a project boundary.
   */
  kind?: "project";

  /**
   * Main TypeSpec file for this project, relative to the config directory.
   * Only meaningful when `kind` is `"project"`. Defaults to `"main.tsp"`.
   */
  entrypoint?: string;

  /**
   * Compiler features enabled for this project.
   * Only meaningful when `kind` is `"project"`.
   */
  features?: string[];

  "environment-variables"?: Record<string, ConfigEnvironmentVariable>;
  parameters?: Record<string, ConfigParameter>;

  "warn-as-error"?: boolean;
  "output-dir"?: string;
  trace?: string | string[];
  imports?: string[];

  emit?: string[];
  options?: Record<string, EmitterOptions>;

  permissions?: Record<string, ConfigPermissionGrant>;

  linter?: LinterConfig;
}

/**
 * Permissions a user grants to a specific emitter/library in `tspconfig.yaml`.
 * Anything not listed here is denied. Path scopes should be absolute or relative
 * to the config file; they are resolved during configuration loading.
 */
export interface ConfigPermissionGrant {
  /** Directory/file scopes the emitter/library may read. */
  "fs-read"?: string[];
  /**
   * Directory/file scopes the emitter/library may write, in addition to its own
   * emitter output directory which is always granted.
   */
  "fs-write"?: string[];
  /** Network host patterns the emitter/library may contact (supports `*` and `*.host`). */
  network?: string[];
  /** Environment variable names the emitter/library may read. */
  env?: string[];
  /** Allow spawning child processes: `true` for any command or a list of allowed commands. */
  exec?: boolean | string[];
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
  enable?: Record<RuleRef, LinterRuleEnableValue>;
  disable?: Record<RuleRef, string>;
}
