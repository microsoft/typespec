/** normalize / and \\ to / */
export function normalizeSlash(str: string): string {
  return str.replaceAll(/\\/g, "/");
}
