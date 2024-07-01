export function convertHeaderName(s: string): string {
  return s
    .split("-")
    .map((s, idx) => (idx === 0 ? s : s.substring(0, 1).toUpperCase() + s.substring(1)))
    .join("");
}
