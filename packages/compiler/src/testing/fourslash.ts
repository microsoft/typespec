/**
 * PositionedMarker represents a marker in the code with its name and position.
 */
export interface PositionedMarker {
  /** Marker name */
  readonly name: string;
  /** Position of the marker */
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
