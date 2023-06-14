import { Parser, ParserOptions } from "prettier";
import { getSourceLocation } from "../core/diagnostics.js";
import { parse as typespecParse, visitChildren } from "../core/parser.js";
import { Diagnostic, Node, TypeSpecScriptNode } from "../core/types.js";
import { mutate } from "../core/util.js";

export function parse(
  text: string,
  parsers: { [parserName: string]: Parser },
  opts: ParserOptions & { parentParser?: string }
): TypeSpecScriptNode {
  const result = typespecParse(text, { comments: true, docs: false });
  function linkParents(node: Node) {
    visitChildren(node, (child) => {
      mutate(child).parent = node;
      linkParents(child);
    });
  }
  linkParents(result);
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
