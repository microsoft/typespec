import { isWhiteSpace } from "../charcode.js";
import { SourceLocation } from "../types.js";

export function findLineStartAndIndent(location: SourceLocation): {
  lineStart: number;
  indent: string;
} {
  const text = location.file.text;
  let pos = location.pos;
  let indent = 0;
  while (pos > 0 && text[pos - 1] !== "\n") {
    if (isWhiteSpace(text.charCodeAt(pos - 1))) {
      indent++;
    } else {
      indent = 0;
    }
    pos--;
  }
  return { lineStart: pos, indent: location.file.text.slice(pos, pos + indent) };
}
