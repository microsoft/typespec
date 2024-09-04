export function toReadableString(value: any): string {
  if (value === null) {
    return "<null>";
  } else if (value === undefined) {
    return "<undefined>";
  } else if (typeof value === "object") {
    return JSON.stringify(value, null, 2);
  } else {
    return value.toString();
  }
}

/** normalize / and \\ to / */
export function normalizeSlash(str: string): string {
  return str.replaceAll(/\\/g, "/");
}
