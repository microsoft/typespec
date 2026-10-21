import { ok } from "assert";

/**
 * Takes source code with a cursor position indicated by the given marker
 * ("┆" by default), and returns the source without the marker along with
 * the cursor position. Only the first occurrence is removed; throws if no marker is found.
 */
export function extractCursor(
  sourceWithCursor: string,
  marker = "┆",
): {
  /** Source with the first cursor marker removed. */
  source: string;
  /** Zero-based UTF-16 offset at which the marker was removed. */
  pos: number;
} {
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
): { source: string; pos: number[] } {
  const positions: number[] = [];
  let pos = sourceWithCursor.indexOf(marker);
  while (pos >= 0) {
    positions.push(pos);
    pos = sourceWithCursor.indexOf(marker, pos + 1);
  }
  for (let i = 0; i < positions.length; i++) {
    positions[i] -= i * marker.length;
  }
  ok(positions.length > 0, "marker not found");
  return { source: sourceWithCursor.replaceAll(marker, ""), pos: positions };
}

/**
 * Takes source code with start and end positions indicated by given marker
 * ("~~~" by default) and returns the source without the markers along with
 * the start and end positions. Removes the first two occurrences and throws if either is missing.
 */
export function extractSquiggles(
  sourceWithSquiggles: string,
  marker = "~~~",
): {
  /** Source with the two range markers removed. */
  source: string;
  /** Zero-based UTF-16 start offset in the returned source. */
  pos: number;
  /** Exclusive UTF-16 end offset in the returned source. */
  end: number;
} {
  const { source: sourceWithoutFistSquiggle, pos } = extractCursor(sourceWithSquiggles, marker);
  const { source, pos: end } = extractCursor(sourceWithoutFistSquiggle, marker);
  return { source, pos, end };
}
