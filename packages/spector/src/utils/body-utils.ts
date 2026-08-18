/**
 * Cleanup the raw content:
 *  - trim whitespaces
 *  - replace \r\n with \n
 * @param rawContent: raw content to clean.
 */
export const cleanupBody = (rawContent: string): string =>
  rawContent.trim().replace(/\r?\n|\r/g, "\n");

export function parseJsonLines(rawContent: string | Buffer): unknown[] {
  const content = Buffer.isBuffer(rawContent) ? rawContent.toString("utf8") : rawContent;
  const lines = content.split(/\r?\n/);
  if (lines.at(-1) === "") {
    lines.pop();
  }
  return lines.map((line) => JSON.parse(line));
}
