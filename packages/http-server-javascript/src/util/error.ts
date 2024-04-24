/**
 * A utility error for unimplemented functionality.
 */
export class UnimplementedError extends Error {
  constructor(message: string) {
    super(`Unimplemented: ${message}`);
  }
}
