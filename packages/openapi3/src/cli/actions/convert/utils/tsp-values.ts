/** Convert a JS object to a tsp value */
export function toTspValues(item: unknown): string {
  if (typeof item === "object") {
    if (Array.isArray(item)) {
      return `#[${item.map(toTspValues).join(", ")}]`;
    } else {
      const content = Object.entries(item!)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => {
          if (typeof value === "string") {
            return `${key}: "${value}"`;
          }

          return `${key}: ${toTspValues(value)}`;
        })
        .join(", ");

      return `#{${content}}`;
    }
  } else {
    return JSON.stringify(item);
  }
}
