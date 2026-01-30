import { definePlugin } from "@expressive-code/core";

/**
 * Plugin to handle comment-based highlight markers in code blocks.
 * Supports:
 * - // highlight-start ... // highlight-end
 * - // highlight-next-line
 */
export default function commentHighlightsPlugin() {
  // Store the line numbers to highlight per code block
  const highlightData = new WeakMap<any, number[]>();

  return definePlugin({
    name: "comment-highlights",
    hooks: {
      preprocessCode: ({ codeBlock }) => {
        const lines = codeBlock.getLines();
        const linesToHighlight = new Set<number>();
        const linesToDelete: number[] = [];

        for (let i = 0; i < lines.length; i++) {
          const lineText = lines[i].text.trim();

          // Check for highlight-next-line
          if (lineText === "// highlight-next-line") {
            if (i + 1 < lines.length) {
              linesToHighlight.add(i + 1);
            }
            linesToDelete.push(i);
          }
          // Check for highlight-start
          else if (lineText === "// highlight-start") {
            linesToDelete.push(i);
            // Find the matching highlight-end
            let j = i + 1;
            while (j < lines.length) {
              const endLineText = lines[j].text.trim();
              if (endLineText === "// highlight-end") {
                linesToDelete.push(j);
                break;
              }
              linesToHighlight.add(j);
              j++;
            }
          }
        }

        // If we found any markers, process them
        if (linesToDelete.length > 0) {
          // Delete marker lines
          codeBlock.deleteLines(linesToDelete);

          // Adjust line indices after deletion
          const deletedLinesBefore = (lineIndex: number) => {
            return linesToDelete.filter((deletedIndex) => deletedIndex < lineIndex).length;
          };

          const adjustedLineNumbers: number[] = [];
          linesToHighlight.forEach((lineIndex) => {
            const adjustedIndex = lineIndex - deletedLinesBefore(lineIndex);
            // Store 1-based line numbers
            adjustedLineNumbers.push(adjustedIndex + 1);
          });

          // Store for preprocessMetadata hook
          if (adjustedLineNumbers.length > 0) {
            highlightData.set(codeBlock, adjustedLineNumbers);
          }
        }
      },
      preprocessMetadata: ({ codeBlock }) => {
        const lineNumbers = highlightData.get(codeBlock);
        if (lineNumbers && lineNumbers.length > 0) {
          // Set the mark prop which will be processed by the text-markers plugin
          const props = codeBlock.props as any;
          props.mark = lineNumbers;
        }
      },
    },
  });
}

