/**
 * A named fourslash-style comment's location in the complete compiled source.
 */
export interface PositionedMarker {
  /** Name inside the marker comment, used as the collected entity's result key. */
  readonly name: string;
  /** Zero-based UTF-16 offset immediately after the marker comment; the comment is not removed. */
  readonly pos: number;
}

/**
 * Extract TypeScript fourslash-style markers: /\*markerName*\/
 * @param code
 * @returns  an array of Marker objects with name, pos, and end
 */
export function extractMarkers(code: string): PositionedMarker[] {
  const markerRegex = /\/\*([a-zA-Z0-9_]+)\*\//g;
  const markers: PositionedMarker[] = [];
  let match: RegExpExecArray | null;
  while ((match = markerRegex.exec(code)) !== null) {
    const markerName = match[1];
    const pos = markerRegex.lastIndex;
    markers.push({ name: markerName, pos });
  }
  return markers;
}
