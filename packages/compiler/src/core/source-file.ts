import { CharCode } from "./charcode.js";
import { getAnyExtensionFromPath } from "./path-utils.js";
import type { SourceFile, SourceFileKind } from "./types.js";

export function createSourceFile(text: string, path: string): SourceFile {
  let lineStarts: number[] | undefined = undefined;

  return {
    text,
    path,
    getLineStarts,
    getLineAndCharacterOfPosition,
  };

  function getLineStarts() {
    return (lineStarts = lineStarts ?? scanLineStarts(text));
  }

  function getLineAndCharacterOfPosition(position: number) {
    const starts = getLineStarts();

    let line = binarySearch(starts, position);

    // When binarySearch returns < 0 indicating that the value was not found, it
    // returns the bitwise complement of the index where the value would need to
    // be inserted to keep the array sorted. So flipping the bits back to this
    // positive index tells us what the line number would be if we were to
    // create a new line starting at the given position, and subtracting 1 from
    // that therefore gives us the line number we're after.
    if (line < 0) {
      line = ~line - 1;
    }

    return {
      line,
      character: position - starts[line],
    };
  }
}

export function getSourceFileKindFromExt(path: string): SourceFileKind | undefined {
  const ext = getAnyExtensionFromPath(path);
  if (ext === ".js" || ext === ".mjs") {
    return "js";
  } else if (ext === ".tsp" || ext === ".cadl") {
    return "typespec";
  } else {
    return undefined;
  }
}

function scanLineStarts(text: string): number[] {
  const starts = [];
  let start = 0;
  let pos = 0;

  while (pos < text.length) {
    const ch = text.charCodeAt(pos);
    pos++;
    switch (ch) {
      case CharCode.CarriageReturn:
        if (text.charCodeAt(pos) === CharCode.LineFeed) {
          pos++;
        }
      // fallthrough
      case CharCode.LineFeed:
        starts.push(start);
        start = pos;
        break;
    }
  }

  starts.push(start);
  return starts;
}

/**
 * Search sorted array of numbers for the given value. If found, return index
 * in array where value was found. If not found, return a negative number that
 * is the bitwise complement of the index where value would need to be inserted
 * to keep the array sorted.
 */
function binarySearch(array: readonly number[], value: number) {
  let low = 0;
  let high = array.length - 1;
  while (low <= high) {
    const middle = low + ((high - low) >> 1);
    const v = array[middle];
    if (v < value) {
      low = middle + 1;
    } else if (v > value) {
      high = middle - 1;
    } else {
      return middle;
    }
  }

  return ~low;
}
