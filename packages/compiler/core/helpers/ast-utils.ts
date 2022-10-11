// Set of utils around the AST syntax tree

import { CadlScriptNode, NamespaceStatementNode, Node, Statement, SyntaxKind } from "../types.js";
import { isArray, isDefined } from "../util.js";

/**
 * Find all the statement of the given kind in the given cadl script or namespace node.
 * Resolve the statement recursively(Looks in subnamespaces)
 * @param root Lookup root. Can either be a CadlScript root or a NamespaceNode
 * @param kind Statement kind to lookup
 * @returns List of the statement node of the given kind.
 *
 * @example findStatementsIn(cadlDocument, SyntaxKind.AliasStatement) //=> AliasStatementNode[]
 */
export function findStatementsIn<T extends Statement["kind"]>(
  root: CadlScriptNode | NamespaceStatementNode,
  kind: T
): Array<Node & { kind: T }> {
  if (root.statements === undefined) {
    return [];
  } else if (isArray(root.statements)) {
    return root.statements
      .flatMap((statement): Array<Node & { kind: T }> | undefined => {
        if (statement.kind === SyntaxKind.NamespaceStatement) {
          if (statement.kind === kind) {
            return [statement as any, ...findStatementsIn<T>(statement, kind)];
          }
          return findStatementsIn<T>(statement, kind);
        } else if (statement.kind === kind) {
          return [statement as any];
        } else {
          return undefined;
        }
      })
      .filter(isDefined);
  } else {
    return findStatementsIn(root.statements, kind);
  }
}
