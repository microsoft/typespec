import { isWhiteSpaceSingleLine } from "../charcode.js";
import { defineCodeFix } from "../diagnostics.js";
import { splitLines } from "../helpers/syntax-utils.js";
import type { SourceLocation } from "../types.js";

export function createTripleQuoteIndentCodeFix(location: SourceLocation) {
  return defineCodeFix({
    id: "triple-quote-indent",
    label: "Format triple-quote-indent",
    fix: (context) => {
      const splitStr = "\n";
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

      if (lines[0].trim() === "") {
        lines.shift();
      }

      const lastLine = lines[lines.length - 1];
      if (lastLine.trim() === "") {
        lines.pop();
      }

      let prefix = "";
      const minIndentNumb = Math.min(...lines.map((line) => getIndentNumbInLine(line)));
      const lastLineIndentNumb = getIndentNumbInLine(lastLine);
      if (minIndentNumb < lastLineIndentNumb) {
        const indentDiff = lastLineIndentNumb - minIndentNumb;
        prefix = " ".repeat(indentDiff);
      }

      const middle = lines.map((line) => `${prefix}${line}`).join(splitStr);
      return context.replaceText(
        location,
        `${tripleQuote}${splitStr}${middle}${splitStr}${" ".repeat(lastLineIndentNumb)}${tripleQuote}`,
      );

      function getIndentNumbInLine(lineText: string): number {
        let curStart = 0;
        while (
          curStart < lineText.length &&
          isWhiteSpaceSingleLine(lineText.charCodeAt(curStart))
        ) {
          curStart++;
        }
        return curStart;
      }
    },
  });
}
