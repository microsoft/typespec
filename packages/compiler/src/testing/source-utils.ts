import { ok } from "assert";

/**
 * Takes source code with a cursor position indicated by the given marker
 * ("┆" by default), and returns the source without the marker along with
 * the cursor position.
 */
export function extractCursor(
  sourceWithCursor: string,
  marker = "┆",
): { source: string; pos: number } {
  const pos = sourceWithCursor.indexOf(marker);
  ok(pos >= 0, "marker not found");
  const source = sourceWithCursor.replace(marker, "");
  return { source, pos };
}

/**
 * Takes source code with a cursor position indicated by the given marker
 * ("┆" by default), and returns the source without the marker along with
 * the cursor position.
 */
export function extractCursors(
  sourceWithCursor: string,
  marker = "┆",
): { source: string; positions: number[] } {
  const positions: number[] = [];
  let offset = 0;
  const sourceLength = sourceWithCursor.length;
  while (offset < sourceLength) {
    const pos = sourceWithCursor.indexOf(marker, offset);
    if (pos === -1) break;
    positions.push(pos - marker.length * positions.length);
    offset = pos + marker.length;
  }
  const source = sourceWithCursor.replace(new RegExp(marker, "g"), "");
  return { source, positions };
}

/**
 * Takes source code with start and end positions indicated by given marker
 * ("~~~" by default) and returns the source without the markers along with
 * the start and end positions.
 */
export function extractSquiggles(
  sourceWithSquiggles: string,
  marker = "~~~",
): { source: string; pos: number; end: number } {
  const { source: sourceWithoutFistSquiggle, pos } = extractCursor(sourceWithSquiggles, marker);
  const { source, pos: end } = extractCursor(sourceWithoutFistSquiggle, marker);
  return { source, pos, end };
}
