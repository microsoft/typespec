export class ValidationError extends Error {
  public status = 400;

  /**
   * Error thrown there there is a validation issue.
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

  public toJSON(): string {
    return JSON.stringify({ message: this.message, expected: this.expected, actual: this.actual });
  }
}
