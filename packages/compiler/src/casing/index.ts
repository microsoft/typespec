/**
 * Simple utility function to capitalize a string.
 */
export function capitalize<S extends string>(s: S): Capitalize<S> {
  return (s.charAt(0).toUpperCase() + s.slice(1)) as Capitalize<S>;
}
