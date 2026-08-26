/**
 * Computes which lines in the new text are changed or inserted compared to the old text.
 * Uses a greedy forward-matching approach to handle insertions/deletions.
 */
export function getChangedLineNumbers(oldText: string, newText: string): number[] {
  const oldLines = oldText.split("\n");
  const newLines = newText.split("\n");

  const matchedNewIndices = new Set<number>();

  // Simple greedy match: walk both arrays with two pointers
  let oi = 0;
  for (let ni = 0; ni < newLines.length; ni++) {
    for (let j = oi; j < oldLines.length; j++) {
      if (newLines[ni] === oldLines[j]) {
        matchedNewIndices.add(ni);
        oi = j + 1;
        break;
      }
    }
  }

  // Lines not matched are changed/inserted
  const changed: number[] = [];
  for (let ni = 0; ni < newLines.length; ni++) {
    if (!matchedNewIndices.has(ni)) {
      changed.push(ni + 1); // Monaco lines are 1-based
    }
  }
  return changed;
}
