import { EmitterOptions, TypeSpecConfig } from "../config/types.js";
import { LinterRuleSet, ParseOptions } from "./types.js";

export interface CompilerOptions {
  miscOptions?: Record<string, unknown>;
  /**
   * Default output directory used by emitters.
   *
   * @default ./tsp-output
   */
  outputDir?: string;

  /**
   * Path to config YAML file used, this is also where the project root should be.
   */
  config?: string;

  /**
   * List or path to emitters to use.
   */
  emit?: string[];

  /**
   * List emitted outputs and their paths.
   */
  listFiles?: boolean;

  /**
   * Emitter options.
   * Key value pair where the key must be the emitter name.
   */
  options?: Record<string, EmitterOptions>;

  /**
   * Suppress all `deprecated` warnings.
   */
  ignoreDeprecated?: boolean;

  nostdlib?: boolean;

  /**
   * Do not run emitters. Same as setting `emit: []`
   * If both `emit` and `noEmit` are set, `noEmit` takes precedence.
   */
  noEmit?: boolean;

  /**
   * Runs emitters but do not write any output.
   * Only runs emitters supporting this functionality
   */
  dryRun?: boolean;
  additionalImports?: string[];
  warningAsError?: boolean;

  /**
   * When true, indicates that a compilation is being performed for live
   * analysis in the language server.
   */
  designTimeBuild?: boolean;

  /**
   * Trace area to enable.
   */
  trace?: string[];

  parseOptions?: ParseOptions;

  /** Ruleset to enable for linting. */
  linterRuleSet?: LinterRuleSet;

  /** @internal */
  readonly configFile?: TypeSpecConfig;
}
