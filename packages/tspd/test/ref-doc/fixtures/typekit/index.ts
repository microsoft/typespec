export type Diagnosable<F> = F & { withDiagnostics: F };

/**
 * A kit with wrapped
 * summary text.
 *
 * Another paragraph.
 * @experimental
 * @typekit test
 */
export interface TestKit {
  /** The default value. */
  get value(): string;

  /**
   * Run a task using {@link SubKit | nested helpers}.
   * @param input The input to process.
   * @param options Optional configuration.
   * @returns Whether the task succeeded.
   * @example
   * ```ts
   * const result = run("hello", {
   *   enabled: true,
   * });
   * ```
   */
  run(input: string, options?: { enabled?: boolean }): boolean;

  /** Helpers for nested tasks. */
  nested: SubKit;

  /**
   * Resolve the input, with optional diagnostics.
   * @param input The input to resolve.
   */
  diagnose: Diagnosable<(input: string, strict?: boolean) => string | undefined>;

  /** Find an input's size. */
  size: (input: string) => number;

  /** Resolve a generic input. */
  generic: Diagnosable<<T extends string>(input: T) => T | undefined>;

  /** Helpers declared inline. */
  inline: {
    /** Check an input. */
    check(input: string): boolean;
  };
}

export interface SubKit {
  /** Collect the inputs. */
  collect(...values: string[]): string[];

  /** @param input The input to check. */
  has(input: string): boolean;
}
