import type { ParserOptions } from "prettier";
import { getSourceLocation } from "../core/diagnostics.js";
import { parse as typespecParse, visitChildren } from "../core/parser.js";
import { Diagnostic, Node, SyntaxKind, TypeSpecScriptNode } from "../core/types.js";
import { mutate } from "../utils/misc.js";

export function parse(text: string, options: ParserOptions<any>): TypeSpecScriptNode {
  const result = typespecParse(text, { comments: true, docs: true });

  flattenNamespaces(result);

  const errors = result.parseDiagnostics.filter((x) => x.severity === "error");
  if (errors.length > 0 && !result.printable) {
    throw new PrettierParserError(errors[0]);
  }
  // Remove doc comments as those are handled directly.
  mutate(result).comments = result.comments.filter(
    (x) => !(x.kind === SyntaxKind.BlockComment && x.parsedAsDocs),
  );
  return result;
}

/**
 * We are patching the syntax tree to flatten the namespace nodes that are created from namespace Foo.Bar; which have the same pos, end
 * This causes prettier to not know where comments belong.
 * https://github.com/microsoft/typespec/pull/2061
 */
function flattenNamespaces(base: Node) {
  visitChildren(base, (node) => {
    if (node.kind === SyntaxKind.NamespaceStatement) {
      let current = node;
      const ids = [node.id];
      while (current.statements && "kind" in current.statements) {
        current = current.statements;
        ids.push(current.id);
      }
      Object.assign(node, current, {
        ids,
      });
      flattenNamespaces(current);
    }
  });
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
