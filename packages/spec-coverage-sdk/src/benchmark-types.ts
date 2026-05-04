/** Benchmark result for a single TypeSpec compiler run. */
export interface CompilerBenchmarkResult {
  /**
   * The git commit SHA that was benchmarked.
   */
  commit: string;

  /**
   * UTC datetime string when this benchmark was recorded.
   */
  date: string;

  /**
   * Measured durations in milliseconds for each compilation phase.
   */
  metrics: CompilerBenchmarkMetrics;
}

/** Performance metrics captured from a single TypeSpec compilation. */
export interface CompilerBenchmarkMetrics {
  /** Total compilation duration in ms. */
  total: number;
  /** Time spent in the loader phase in ms. */
  loader: number;
  /** Time spent in the resolver phase in ms. */
  resolver: number;
  /** Time spent in the type checker phase in ms. */
  checker: number;
  /** Time spent in validation in ms. */
  validation: number;
  /** Time spent linting in ms. */
  linter: number;
}

/** Historical collection of compiler benchmark results. */
export interface CompilerBenchmarkHistory {
  results: CompilerBenchmarkResult[];
}
