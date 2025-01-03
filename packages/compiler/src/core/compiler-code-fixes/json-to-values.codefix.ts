import { CharCode } from "../charcode.js";
import { defineCodeFix, getSourceLocation } from "../diagnostics.js";
import { DiagnosticTarget } from "../types.js";

export function createJsonToValuesCodeFix(node: DiagnosticTarget) {
  return defineCodeFix({
    id: "json-to-values",
    label: `Convert json to values`,
    fix: (context) => {
      const location = getSourceLocation(node);
      const text = location.file.text;
      let pos = location.pos;
      const end = location.end;
      const range: number[] = [];
      while (pos < end) {
        if (text.charCodeAt(pos) === CharCode.DoubleQuote) {
          range.push(pos);
        }
        if (range.length === 2) {
          break;
        }
        pos++;
      }
      const replaceText = text.slice(range[0] + 1, range[1]);
      return context.replaceText({ ...location, pos: range[0], end: range[1] + 1 }, replaceText);
    },
  });
}
