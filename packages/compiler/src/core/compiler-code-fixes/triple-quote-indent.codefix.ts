import { splitLines } from "../../formatter/print/printer.js";
import { CharCode, isWhiteSpaceSingleLine } from "../charcode.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { DiagnosticTarget } from "../types.js";

export function createTripleQuoteIndentCodeFix(diagnosticTarget: DiagnosticTarget) {
  return defineCodeFix({
    id: "triple-quote-indent",
    label: "Format triple-quote-indent",
    fix: (context) => {
      const location = getSourceLocation(diagnosticTarget);
      const text = location.file.text.slice(location.pos + 3, location.end - 3);
      const splitStr = "\r\n";
      const tripleQuote = '"""';

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
          lastLine = `${lastLine}${splitStr}${prefix}${tripleQuote}`;
          lines.pop();
        }

        // Only indentation is left in the middle
        const middle = lines
          .map((line) => {
            return minIndentNumb !== lastLineIndentNumb
              ? `${splitStr}${prefix}${line.trim()}`
              : line;
          })
          .join("");

        return context.replaceText(location, `${firstLine}${middle}${lastLine}`);
      }

      return;
    },
  });
}

function getIndentNumbInLine(lineText: string): number {
  let curStart = 0;
  const text = lineText.replace(/(\r\n|\n|\r)/gm, "\r\n");
  const len = text.length;
  const flag =
    len >= 2 &&
    text.charCodeAt(curStart) === CharCode.CarriageReturn &&
    text.charCodeAt(curStart + 1) === CharCode.LineFeed;

  if (flag) {
    curStart += 2;
  }

  while (curStart < len && isWhiteSpaceSingleLine(text.charCodeAt(curStart))) {
    curStart++;
  }

  return flag ? curStart - 2 : curStart;
}
