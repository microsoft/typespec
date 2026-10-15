import type { Diagnostic, LinterRuleEnableValue, RuleRef, RuleSetRef } from "../core/types.js";
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

  /** Rule sets and individual rule overrides applied during linting. */
  linter?: LinterConfig;
}

/**
 * Represent the configuration that can be provided in a config file.
 */
export interface TypeSpecRawConfig {
  /** Path to a base configuration, resolved relative to this configuration file. */
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

  /** Environment variables available to interpolation as `{env.NAME}`, with fallback values. */
  "environment-variables"?: Record<string, ConfigEnvironmentVariable>;
  /** Named interpolation parameters and their defaults; explicit arguments override these defaults. */
  parameters?: Record<string, ConfigParameter>;

  /** Treat unsuppressed compiler warnings as errors. */
  "warn-as-error"?: boolean;
  /** Default emitter output directory; supports configuration variable interpolation. */
  "output-dir"?: string;
  /** Trace-area filters, supplied as one filter or a list. */
  trace?: string | string[];
  /** Additional modules to import when compiling the project. */
  imports?: string[];

  /** Emitter package names or paths to load and run. */
  emit?: string[];
  /** Emitter-specific settings keyed by the emitter name used in `emit`. */
  options?: Record<string, EmitterOptions>;

  /** Rule sets and individual rule overrides applied during linting. */
  linter?: LinterConfig;
}

/** Fallback for an environment variable declared for configuration interpolation. */
export interface ConfigEnvironmentVariable {
  /** Value to use when the supplied environment does not define this variable. */
  default: string;
}

/** Default value for a named configuration interpolation parameter. */
export interface ConfigParameter {
  /** Value to use when no explicit argument is supplied for this parameter. */
  default: string;
}

/** Arbitrary emitter-defined settings together with the compiler-recognized output-directory override. */
export type EmitterOptions = Record<string, unknown> & {
  /** Output directory for this emitter; supports variables such as `{output-dir}` and `{emitter-name}`. */
  "emitter-output-dir"?: string;
};

/** Linter rule sets plus per-rule enablement and disabling explanations. */
export interface LinterConfig {
  /** Rule sets to load, referenced as library/rule-set names. */
  extends?: RuleSetRef[];
  /** Rules to enable or configure, keyed by their qualified rule names. */
  enable?: Record<RuleRef, LinterRuleEnableValue>;
  /** Rules to disable, keyed by qualified name with a reason for each suppression. */
  disable?: Record<RuleRef, string>;
}
