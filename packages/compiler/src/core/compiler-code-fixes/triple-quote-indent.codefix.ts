import { splitLines } from "../../formatter/print/printer.js";
import { isWhiteSpaceSingleLine } from "../charcode.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { DiagnosticTarget } from "../types.js";

export function createTripleQuoteIndentCodeFix(diagnosticTarget: DiagnosticTarget) {
  return defineCodeFix({
    id: "triple-quote-indent",
    label: "Format triple-quote-indent",
    fix: (context) => {
      const location = getSourceLocation(diagnosticTarget);
      const splitStr = "\r\n";
      const regex = /(\r\n|\n|\r)/gm;
      const tripleQuote = '"""';
      const tripleQuoteLen = tripleQuote.length;
      const text = location.file.text.slice(
        location.pos + tripleQuoteLen,
        location.end - tripleQuoteLen,
      );

      const lines = splitLines(text);
      if (lines.length === 0) {
        return;
      }

      if (lines.length === 1) {
        const indentNumb = getIndentNumbInLine(lines[0]);
        const prefix = " ".repeat(indentNumb);
        return context.replaceText(
          location,
          [tripleQuote, lines[0], `${prefix}${tripleQuote}`].join(splitStr),
        );
      }

      let firstTripleQuoteOnNewLine = false;
      let lastTripleQuoteOnNewLine = false;
      let firstLine = lines[0];
      if (firstLine.trim() === "") {
        lines.shift();
        firstTripleQuoteOnNewLine = true;
      }

      let lastLine = lines[lines.length - 1];
      if (lastLine.trim() === "") {
        lines.pop();
        lastTripleQuoteOnNewLine = true;
      }

      const minIndentNumb = Math.min(...lines.map((line) => getIndentNumbInLine(line)));
      const lastLineIndentNumb = getIndentNumbInLine(lastLine);
      if (minIndentNumb <= lastLineIndentNumb) {
        const indentDiff = lastLineIndentNumb - minIndentNumb;
        const prefix = " ".repeat(indentDiff);

        if (firstTripleQuoteOnNewLine) {
          firstLine = tripleQuote;
        } else {
          // start triple-quote is not on a new line,
          // this has already been processed, so the removal will not be processed again.
          firstLine = `${tripleQuote}${splitStr}${prefix}${firstLine}`;
          lines.shift();
        }

        if (lastTripleQuoteOnNewLine) {
          lastLine = `${lastLine}${tripleQuote}`;
        } else {
          // end triple-quote is not on a new line
          // this has already been processed, so the removal will not be processed again.
          // When the final triple quote is not on a new line, it needs to maintain the same indentation as the content.
          const lastLineIndent = " ".repeat(indentDiff);
          lastLine = `${lastLine}${splitStr}${lastLineIndent}${tripleQuote}`;
          lines.pop();
        }

        // Only indentation is left in the middle
        const middle = lines
          .map((line) => {
            return minIndentNumb !== lastLineIndentNumb
              ? `${splitStr}${prefix}${line.replace(regex, "")}`
              : line;
          })
          .join("");

        return context.replaceText(location, `${firstLine}${middle}${lastLine}`);
      }

      return;

      function getIndentNumbInLine(lineText: string): number {
        let curStart = 0;
        const text = lineText.replace(regex, "");
        const len = text.length;

        while (curStart < len && isWhiteSpaceSingleLine(text.charCodeAt(curStart))) {
          curStart++;
        }

        return curStart;
      }
    },
  });
}
