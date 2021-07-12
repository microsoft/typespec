export interface CompilerOptions {
  miscOptions?: any;
  outputPath?: string;
  swaggerOutputFile?: string;
  nostdlib?: boolean;
  noEmit?: boolean;
  serviceCodePath?: string;
  /**
   * When true, indicates that a compilation is being performed for live
   * analysis in the language server.
   *
   * This currently disables execution of decorators and onBuild handlers.
   */
  designTimeBuild?: boolean;
}
