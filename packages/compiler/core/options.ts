import { ParseOptions } from "./types";

export interface CompilerOptions {
  miscOptions?: Record<string, unknown>;
  /**
   * Default output directory used by emitters.
   *
   * @default ./cadl-output
   */
  outputDir?: string;

  /**
   * @deprecated use outputDir.
   */
  outputPath?: string;
  emitters?: Record<string, Record<string, unknown> | boolean>;
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
