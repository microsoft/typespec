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
      const startPos = location.pos;
      const endPos = location.end;
      const offSet = 3;
      const splitOrIndentStr = "\r\n";

      const arrSplintLines = splitLines(location.file.text, startPos + offSet, endPos - offSet);
      const count = arrSplintLines.length;

      const minIndentObj: { startPos: number; indent: number } = arrSplintLines.reduce(
        (prev, curr) => {
          return prev.indent < curr.indent ? prev : curr;
        },
      );

      for (let i = 0; i < count; i++) {
        const line = arrSplintLines[i];
        const lastLine = arrSplintLines[arrSplintLines.length - 1];

        if (i === 0 || i === count - 1) {
          if (i === 0 && line.lineText.trim() !== "") {
            // start triple quote is not on new line
            [startPos + offSet].map((pos) => {
              result.push(
                context.prependText(
                  { ...location, pos },
                  splitOrIndentStr + " ".repeat(lastLine.indent - minIndentObj.indent),
                ),
              );
            });
          }

          if (i === count - 1 && line.lineText.replace(splitOrIndentStr, "").trim() !== "") {
            // end triple quote is not on new line
            [endPos - offSet].map((pos) => {
              result.push(
                context.prependText(
                  { ...location, pos },
                  splitOrIndentStr +
                    " ".repeat(
                      lastLine.indent - (arrSplintLines.length === 1 ? 0 : minIndentObj.indent),
                    ),
                ),
              );
            });
          }
        } else {
          // All triple quote is on new line, but content is not indented the same as the closing triple quote
          // So take the difference between the last line and the smallest indentation in all lines,
          // and supplement the indentation of each line (except the first and last lines)
          result.push(
            context.prependText(
              { ...location, pos: arrSplintLines[i].startPos },
              " ".repeat(lastLine.indent - minIndentObj.indent),
            ),
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
  const indentNumb = getIndentInLine(lineText);
  lines.push({ startPos: start + 2, indent: indentNumb, lineText });

  return lines;

  function addObjToArray() {
    const lineText = text.slice(start, pos);
    const indentNumb = getIndentInLine(lineText);
    lines.push({ startPos: start + 2, indent: indentNumb, lineText });
    start = pos;
  }
}

function getIndentInLine(lineText: string): number {
  let curStart = 0;
  const curEnd = lineText.length;
  let indentNumb = 0;
  if (
    lineText.charCodeAt(curStart) === CharCode.CarriageReturn &&
    lineText.charCodeAt(curStart + 1) === CharCode.LineFeed
  ) {
    curStart += 2;
  }

  while (curStart < curEnd && isWhiteSpaceSingleLine(lineText.charCodeAt(curStart))) {
    indentNumb++;
    curStart++;
  }
  return indentNumb;
}
