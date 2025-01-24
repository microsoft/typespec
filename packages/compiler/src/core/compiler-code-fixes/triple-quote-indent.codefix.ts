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
      const newlineRegex = /(\r\n|\n|\r)/gm;
      const tripleQuote = '"""';
      const tripleQuoteLen = tripleQuote.length;
      const text = location.file.text.slice(
        location.pos + tripleQuoteLen,
        location.end - tripleQuoteLen,
      );

      const lines = splitLines(text).map((line) => line.replace(newlineRegex, ""));
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

      const middle = lines.map((line) => `${splitStr}${prefix}${line}`).join("");
      return context.replaceText(
        location,
        `${tripleQuote}${middle}${splitStr}${" ".repeat(lastLineIndentNumb)}${tripleQuote}`,
      );

      function getIndentNumbInLine(lineText: string): number {
        let curStart = 0;
        const text = lineText.replace(newlineRegex, "");
        const len = text.length;

        while (curStart < len && isWhiteSpaceSingleLine(text.charCodeAt(curStart))) {
          curStart++;
        }

        return curStart;
      }
    },
  });
}
