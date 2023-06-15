import { EmitterOptions } from "../config/types.js";
import { ParseOptions } from "./types.js";

export interface CompilerOptions {
  miscOptions?: Record<string, unknown>;
  /**
   * Default output directory used by emitters.
   *
   * @default ./tsp-output
   */
  outputDir?: string;

  /**
   * Path to config YAML file or folder in which to search for default tspconfig.yaml file.
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

  nostdlib?: boolean;
  noEmit?: boolean;
  additionalImports?: string[];
  watchForChanges?: boolean;
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
}
