import { parseDirective } from "../core/directives.js";
import { visitChildren } from "../core/parser.js";
import type {
  DirectiveExpressionNode,
  Node,
  SourceLocation,
  SuppressDirective,
  TypeSpecScriptNode,
} from "../core/types.js";
import { SyntaxKind } from "../core/types.js";
import { isArray } from "../utils/misc.js";

/** A declaration or member in a suppression's structural context. */
export interface SuppressionScope {
  /** The declaration, member, or anonymous container node. */
  readonly node: Node;
  /** Decoded declaration name, if named. */
  readonly name?: string;
}

/** A suppress directive and its location and declaration context in one source file. */
export interface Suppression {
  /** Parsed directive, preserving its written code and justification. */
  readonly directive: SuppressDirective;
  /** The syntax node carrying the directive. */
  readonly target: Node;
  /** Directive range in the source file, including any trailing trivia in its AST range. */
  readonly location: SourceLocation;
  /**
   * Structural context, outermost first, including the target if it is a declaration or member.
   * Includes file-scoped namespaces and anonymous containers, but not incidental syntax nodes.
   * This is not a semantic scope or a guarantee of a unique declaration identity.
   */
  readonly scope: readonly SuppressionScope[];
}

/**
 * Collect suppress directives from a parsed file without binding or compiling it.
 *
 * Returns directives in source order, including duplicates and codes from unavailable libraries.
 * Multiple AST references to the same directive are returned once, with the deepest attachment.
 * Codes are not resolved, and neither usage nor effectiveness is checked. Inspect
 * `script.parseDiagnostics` before treating the inventory as complete.
 *
 * @param script Parsed source file. Its nodes are not modified.
 */
export function collectSuppressions(script: TypeSpecScriptNode): readonly Suppression[] {
  const suppressions = new Map<DirectiveExpressionNode, Suppression>();
  let fileScope: readonly SuppressionScope[] = [];
  for (const statement of script.statements) {
    visit(statement, fileScope);
    let namespace = statement;
    const namespaceScope: SuppressionScope[] = [];
    while (namespace.kind === SyntaxKind.NamespaceStatement) {
      namespaceScope.push({ node: namespace, name: namespace.id.sv });
      if (namespace.statements === undefined) {
        fileScope = [...fileScope, ...namespaceScope];
        break;
      }
      if (isArray(namespace.statements)) {
        break;
      }
      namespace = namespace.statements;
    }
  }
  return [...suppressions.values()].sort((a, b) => a.location.pos - b.location.pos);

  function visit(node: Node, parentScope: readonly SuppressionScope[]) {
    const entry = getScope(node);
    const scope = entry ? [...parentScope, entry] : parentScope;
    for (const directiveNode of node.directives ?? []) {
      const directive = parseDirective(directiveNode);
      if (directive?.name === "suppress") {
        suppressions.set(directive.node, {
          directive,
          target: node,
          location: { file: script.file, pos: directive.node.pos, end: directive.node.end },
          scope,
        });
      }
    }
    visitChildren(node, (child) => {
      if (node.kind === SyntaxKind.OperationSignatureDeclaration && child === node.parameters) {
        visitChildren(child, (parameter) => visit(parameter, scope));
      } else {
        visit(child, scope);
      }
    });
  }
}

function getScope(node: Node): SuppressionScope | undefined {
  switch (node.kind) {
    case SyntaxKind.NamespaceStatement:
    case SyntaxKind.ModelStatement:
    case SyntaxKind.ModelDeclarationExpression:
    case SyntaxKind.ModelProperty:
    case SyntaxKind.InterfaceStatement:
    case SyntaxKind.OperationStatement:
    case SyntaxKind.UnionStatement:
    case SyntaxKind.UnionDeclarationExpression:
    case SyntaxKind.UnionVariant:
    case SyntaxKind.EnumStatement:
    case SyntaxKind.EnumDeclarationExpression:
    case SyntaxKind.EnumMember:
    case SyntaxKind.ScalarStatement:
    case SyntaxKind.ScalarDeclarationExpression:
    case SyntaxKind.ScalarConstructor:
    case SyntaxKind.AliasStatement:
    case SyntaxKind.ConstStatement:
    case SyntaxKind.DecoratorDeclarationStatement:
    case SyntaxKind.FunctionDeclarationStatement:
    case SyntaxKind.FunctionParameter:
      return { node, name: node.id?.sv };
    case SyntaxKind.ModelExpression:
      return { node };
    default:
      return undefined;
  }
}
