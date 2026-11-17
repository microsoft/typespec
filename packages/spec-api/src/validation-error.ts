/** Request assertion failure carrying expected and actual values for client-facing diagnostics. */
export class ValidationError extends Error {
  /** HTTP status annotation for a validation failure, initialized to 400. */
  public status = 400;

  /**
   * Creates a failure that retains the compared values without serializing them.
   * @param message Message describing the error.
   * @param expected expected value.
   * @param actual actual value.
   */
  constructor(
    message: string,
    public expected: unknown | undefined,
    public actual: unknown | undefined,
  ) {
    super(message);
  }

  /** Serializes the message, expected and actual values to a JSON string, not a plain object. */
  public toJSON(): string {
    return JSON.stringify({ message: this.message, expected: this.expected, actual: this.actual });
  }
}
