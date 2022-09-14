import { ParseOptions } from "./types";

export interface CompilerOptions {
  miscOptions?: any;
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
