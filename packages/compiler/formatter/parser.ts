import { Parser, ParserOptions } from "prettier";
import { computeTargetLocation } from "../core/diagnostics.js";
import { parse as cadlParse } from "../core/parser.js";
import { CadlScriptNode, Diagnostic } from "../core/types.js";

export function parse(
  text: string,
  parsers: { [parserName: string]: Parser },
  opts: ParserOptions & { parentParser?: string }
): CadlScriptNode {
  const result = cadlParse(text, { comments: true });
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
    const location = computeTargetLocation(error.target);
    this.loc = {
      start: location?.pos ?? 0,
      end: location?.end ?? 0,
    };
  }
}
