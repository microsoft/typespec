import { isLineBreak, isWhiteSpaceSingleLine } from "../charcode.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import type { CodeFixEdit, DiagnosticTarget, SourceLocation } from "../types.js";

export function createTripleQuoteIndentCodeFix(diagnosticTarget: DiagnosticTarget) {
  return defineCodeFix({
    id: "triple-quote-indent",
    label: "Format triple-quote-indent",
    fix: (context) => {
      const result: CodeFixEdit[] = [];

      const location = getSourceLocation(diagnosticTarget);
      const { startPos: startPosArr, indent } = findStartPositionAndIndent(location);
      startPosArr.map((pos) => {
        const updatedLocation = { ...location, pos };
        result.push(context.prependText(updatedLocation, indent));
      });

      return result;
    },
  });
}

function isNoNewlineStartTripleQuote(start: number, end: number, input: string): boolean {
  while (start < end && isWhiteSpaceSingleLine(input.charCodeAt(start))) {
    start++;
  }
  return !isLineBreak(input.charCodeAt(start));
}

function isNoNewlineEndTripleQuote(start: number, end: number, input: string): boolean {
  while (end > start && isWhiteSpaceSingleLine(input.charCodeAt(end - 1))) {
    end--;
  }
  return !isLineBreak(input.charCodeAt(end - 1));
}

function getSpaceNumbBetweenStartPosAndVal(start: number, end: number, input: string): number {
  while (start < end && isWhiteSpaceSingleLine(input.charCodeAt(start))) {
    start++;
  }
  if (isLineBreak(input.charCodeAt(start))) {
    start += 2;
  }

  let spaceNumb = 0;
  while (start < end && isWhiteSpaceSingleLine(input.charCodeAt(start))) {
    spaceNumb++;
    start++;
  }
  return spaceNumb;
}

function getSpaceNumbBetweenEnterAndEndPos(start: number, end: number, input: string): number {
  let spaceNumb = 0;
  while (end > start && isWhiteSpaceSingleLine(input.charCodeAt(end - 1))) {
    spaceNumb++;
    end--;
  }
  return spaceNumb;
}

function findStartPositionAndIndent(location: SourceLocation): {
  startPos: number[];
  indent: string;
} {
  const text = location.file.text;
  const splitOrIndentStr = "\r\n";
  const startPos = location.pos;
  const endPos = location.end;
  const offSet = 3; // The length of `"""`

  const noNewlineStart = isNoNewlineStartTripleQuote(startPos + offSet, endPos, text);
  const noNewlineEnd = isNoNewlineEndTripleQuote(startPos, endPos - offSet, text);
  if (noNewlineStart && noNewlineEnd) {
    // eg. `"""  one   two   """`
    return { startPos: [startPos + offSet, endPos - offSet], indent: splitOrIndentStr };
  } else if (noNewlineStart) {
    // eg. `""" one   two   \r\n"""`
    const startSpaceNumb = getSpaceNumbBetweenStartPosAndVal(startPos + offSet, endPos, text);
    const endSpaceNumb = getSpaceNumbBetweenEnterAndEndPos(startPos, endPos - offSet, text);

    // Only in the case of equals, the `triple-quote-indent` warning will be triggered.
    // The `no-new-line-start-triple-quote` warning is triggered when it is greater than
    if (startSpaceNumb >= endSpaceNumb) {
      return { startPos: [startPos + offSet], indent: splitOrIndentStr };
    } else {
      return {
        startPos: [startPos + offSet],
        indent: splitOrIndentStr + " ".repeat(endSpaceNumb - startSpaceNumb),
      };
    }
  } else if (noNewlineEnd) {
    // eg. `"""\r\n one   two   """`
    const startSpaceNumb = getSpaceNumbBetweenStartPosAndVal(startPos + offSet, endPos, text);
    const endSpaceNumb = getSpaceNumbBetweenEnterAndEndPos(startPos, endPos - offSet, text);
    if (startSpaceNumb < endSpaceNumb) {
      return {
        startPos: [endPos - offSet],
        indent: splitOrIndentStr + " ".repeat(startSpaceNumb),
      };
    } else {
      // Detailed description: `no-new-line-start-triple-quote`, `no-new-line-end-triple-quote`
      // and `triple-quote-indent` are all warnings about incorrect triple quote values.
      // Currently, only `triple-quote-indent` has a quick fix.
      // Todo: add codefix for  `no-new-line-start-triple-quote` and `no-new-line-end-triple-quote` warning

      // It will only warn that the ending """ is not on a new line and will not trigger the triple quote indent warning.
      return {
        startPos: [endPos - offSet],
        indent: splitOrIndentStr + " ".repeat(startSpaceNumb - endSpaceNumb),
      };
    }
  } else {
    // eg. `"""\r\none\r\n  two\r\n  """`
    const endSpaceNumb = getSpaceNumbBetweenEnterAndEndPos(startPos, endPos - offSet, text);
    const arrIndents: number[] = [];
    let start = startPos + offSet;

    // Calculate the number of spaces needed to align each line
    while (start > 0 && start < endPos) {
      const currLineSpaceNumb = getSpaceNumbBetweenStartPosAndVal(start, endPos, text);
      arrIndents.push(currLineSpaceNumb);

      // If it is 0, the method indexOf cannot get the next `\r\n` position, so add 1
      start += currLineSpaceNumb === 0 ? 1 : currLineSpaceNumb;
      start = text.indexOf(splitOrIndentStr, start);
    }

    // Find all the positions of `\r\n` and remove the last one because it is the position of `"""`
    const arrStartPos: number[] = [];
    start = startPos + offSet;
    while (start < endPos) {
      start = text.indexOf(splitOrIndentStr, start);
      if (start < 0) {
        break;
      }
      start += 2;
      if (start < endPos) {
        arrStartPos.push(start);
      }
    }
    arrStartPos.pop();

    //If minSpaceNumb is larger than endSpaceNumb, codefix will not be generated
    const minSpaceNumb = Math.min(...arrIndents);
    return {
      startPos: arrStartPos,
      indent: " ".repeat(endSpaceNumb - minSpaceNumb),
    };
  }
}
