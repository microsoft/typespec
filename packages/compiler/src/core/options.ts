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
   * @deprecated use outputDir.
   */
  outputPath?: string;

  /**
   * List or path to emitters to use.
   */
  emit?: string[];

  /**
   * Emitter options.
   * Key value pair where the key must be the emitter name.
   */
  options?: Record<string, EmitterOptions>;

  /**
   * @deprecated use {@link emit} and {@link options} instead.
   *
   * Will be removed in March 2022 sprint.
   */
  emitters?: Record<string, EmitterOptions>;

  /**
   * Suppress all `deprecated` warnings.
   */
  ignoreDeprecated?: boolean;

  nostdlib?: boolean;
  noEmit?: boolean;
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
