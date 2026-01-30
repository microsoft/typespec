import { definePlugin } from "@expressive-code/core";

/**
 * Plugin to handle comment-based highlight markers in code blocks.
 * Supports:
 * - // highlight-start ... // highlight-end
 * - // highlight-next-line
 */
export default function commentHighlightsPlugin() {
  // Store the line numbers to highlight per code block
  const highlightMap = new WeakMap<any, number[]>();

  console.log('[comment-highlights] Plugin loaded');

  return definePlugin({
    name: "comment-highlights",
    hooks: {
      preprocessCode: ({ codeBlock }) => {
        const lines = codeBlock.getLines();
        const linesToHighlight = new Set<number>();
        const linesToDelete: number[] = [];

        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i].text.trim();

          // Debug: log all lines that contain "highlight"
          if (lineText.includes("highlight")) {
            console.log('[comment-highlights] Line', i, 'contains highlight:', JSON.stringify(lineText));
          }

          // Check for highlight-next-line
          if (lineText === "// highlight-next-line") {
            if (i + 1 < lines.length) {
              linesToHighlight.add(i + 1);
            }
            linesToDelete.push(i);
            console.log('[comment-highlights] Found highlight-next-line at', i);
          }
          // Check for highlight-start
          else if (lineText === "// highlight-start") {
            linesToDelete.push(i);
            console.log('[comment-highlights] Found highlight-start at', i);
            // Find the matching highlight-end
            let j = i + 1;
            while (j < lines.length) {
              const endLineText = lines[j].text.trim();
              if (endLineText === "// highlight-end") {
                linesToDelete.push(j);
                console.log('[comment-highlights] Found highlight-end at', j);
                break;
              }
              linesToHighlight.add(j);
              j++;
            }
          }
        }

        console.log('[comment-highlights] Lines to highlight:', Array.from(linesToHighlight));
        console.log('[comment-highlights] Lines to delete:', linesToDelete);

        // Delete marker lines (in reverse order to maintain indices)
        if (linesToDelete.length > 0) {
          codeBlock.deleteLines(linesToDelete);
        }

        // Adjust line indices after deletion and store them
        const deletedLinesBefore = (lineIndex: number) => {
          return linesToDelete.filter((deletedIndex) => deletedIndex < lineIndex).length;
        };

        const adjustedLineNumbers: number[] = [];
        linesToHighlight.forEach((lineIndex) => {
          const adjustedIndex = lineIndex - deletedLinesBefore(lineIndex);
          const line = codeBlock.getLine(adjustedIndex);
          if (line && !line.text.trim().startsWith("//")) {
            // Use 1-based line number
            adjustedLineNumbers.push(adjustedIndex + 1);
          }
        });

        console.log('[comment-highlights] Adjusted line numbers:', adjustedLineNumbers);

        // Store the line numbers to be used in preprocessMetadata
        if (adjustedLineNumbers.length > 0) {
          highlightMap.set(codeBlock, adjustedLineNumbers);
        }
      },
      preprocessMetadata: ({ codeBlock }) => {
        const lineNumbers = highlightMap.get(codeBlock);
        if (lineNumbers) {
          const props = codeBlock.props as any;
          const currentMark = props.mark || [];
          const markArray = Array.isArray(currentMark) ? [...currentMark] : [currentMark];
          
          lineNumbers.forEach((lineNum) => {
            markArray.push(lineNum);
          });

          props.mark = markArray;
          console.log('[comment-highlights] Set mark prop to:', props.mark);
        }
      },
    },
  });
}

