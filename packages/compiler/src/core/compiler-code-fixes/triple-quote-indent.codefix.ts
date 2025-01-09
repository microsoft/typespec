import { CharCode, isWhiteSpaceSingleLine } from "../charcode.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { CodeFixEdit, DiagnosticTarget } from "../types.js";

export function createTripleQuoteIndentCodeFix(diagnosticTarget: DiagnosticTarget) {
  return defineCodeFix({
    id: "triple-quote-indent",
    label: "Format triple-quote-indent",
    fix: (context) => {
      const result: CodeFixEdit[] = [];
      const location = getSourceLocation(diagnosticTarget);
      const startPos = location.pos + 3;
      const endPos = location.end - 3;
      const splitStr = "\r\n";

      const lines = splitLines(location.file.text, startPos, endPos);

      const firstLine = lines[0];
      if (lines.length > 0 && firstLine.lineText.trim() === "") {
        lines.shift();
      }

      const lastLine = lines[lines.length - 1];
      if (lines.length > 0 && lastLine.lineText.trim() === "") {
        lines.pop();
      }

      const minIndentLine: { startPos: number; indent: number } = lines.reduce((prev, curr) => {
        return prev.indent < curr.indent ? prev : curr;
      });
      if (minIndentLine.indent <= lastLine.indent) {
        let indentDiff = lastLine.indent - minIndentLine.indent;
        const prefix = " ".repeat(indentDiff);
        // start triple-quote is not on a new line
        if (firstLine.lineText.trim() !== "") {
          result.push(context.prependText({ ...location, pos: startPos }, splitStr + prefix));
        }

        if (lastLine.lineText.trim() === lines[lines.length - 1].lineText.trim()) {
          lines.pop();
        }

        if (lines.length > 0 && firstLine.lineText.trim() === lines[0].lineText.trim()) {
          lines.shift();
        }

        lines.map((line) => {
          result.push(context.prependText({ ...location, pos: line.startPos }, prefix));
        });
        // end triple-quote is not on a new line
        if (lastLine.lineText.trim() !== "") {
          indentDiff =
            minIndentLine.indent === lastLine.indent
              ? lastLine.indent
              : lastLine.indent - minIndentLine.indent;
          result.push(
            context.prependText({ ...location, pos: endPos }, splitStr + " ".repeat(indentDiff)),
          );
        }
      }

      return result;
    },
  });
}

function splitLines(
  text: string,
  start: number,
  end: number,
): { startPos: number; indent: number; lineText: string }[] {
  const lines: { startPos: number; indent: number; lineText: string }[] = [];
  let pos = start;

  while (pos <= end) {
    const ch = text.charCodeAt(pos);
    switch (ch) {
      case CharCode.CarriageReturn:
        if (text.charCodeAt(pos + 1) === CharCode.LineFeed) {
          addObjToArray();
          pos++;
        } else {
          addObjToArray();
        }
        break;
      case CharCode.LineFeed:
        addObjToArray();
        break;
    }
    pos++;
  }

  const lineText = text.slice(start, end);
  const indentNumb = getIndentNumbInLine(lineText);
  lines.push({ startPos: start + 2, indent: indentNumb, lineText });

  return lines;

  function addObjToArray() {
    const lineText = text.slice(start, pos);
    const indentNumb = getIndentNumbInLine(lineText);
    lines.push({ startPos: start + 2, indent: indentNumb, lineText });
    start = pos;
  }
}

function getIndentNumbInLine(lineText: string): number {
  let curStart = 0;
  const curEnd = lineText.length;
  const flag =
    curEnd >= 2 &&
    lineText.charCodeAt(curStart) === CharCode.CarriageReturn &&
    lineText.charCodeAt(curStart + 1) === CharCode.LineFeed;

  if (flag) {
    curStart += 2;
  }

  while (curStart < curEnd && isWhiteSpaceSingleLine(lineText.charCodeAt(curStart))) {
    curStart++;
  }

  return flag ? curStart - 2 : curStart;
}
