export interface CompilerOptions {
  miscOptions?: any;
  outputPath?: string;
  swaggerOutputFile?: string;
  nostdlib?: boolean;
  noEmit?: boolean;
  watchForChanges?: boolean;
  serviceCodePath?: string;
  /**
   * When true, indicates that a compilation is being performed for live
   * analysis in the language server.
   */
  designTimeBuild?: boolean;
}
