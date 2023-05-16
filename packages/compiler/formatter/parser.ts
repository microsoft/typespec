import { Parser, ParserOptions } from "prettier";
import { getSourceLocation } from "../core/diagnostics.js";
import { parse as typespecParse } from "../core/parser.js";
import { Diagnostic, TypeSpecScriptNode } from "../core/types.js";

export function parse(
  text: string,
  parsers: { [parserName: string]: Parser },
  opts: ParserOptions & { parentParser?: string }
): TypeSpecScriptNode {
  const result = typespecParse(text, { comments: true, docs: false });
  const errors = result.parseDiagnostics.filter((x) => x.severity === "error");
  if (errors.length > 0 && !result.printable) {
    throw new PrettierParserError(errors[0]);
  }
  return result;
}

export class PrettierParserError extends Error {
  public loc: { start: number; end: number };
  public constructor(public readonly error: Diagnostic) {
    super(error.message);
    const location = getSourceLocation(error.target);
    this.loc = {
      start: location?.pos ?? 0,
      end: location?.end ?? 0,
    };
  }
}
