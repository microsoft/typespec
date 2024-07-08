import {
  IdentifierNode,
  Node,
  StringLiteralNode,
  SyntaxKind,
  TextRange,
  Token,
  TokenFlags,
  TypeSpecScriptNode,
  compilerAssert,
  createScanner,
  isKeyword,
  isPunctuation,
  visitChildren,
} from "../core/index.js";
import { SemanticToken, SemanticTokenKind } from "./types.js";

/**
 * Compute the semantic tokens for the given AST.
 * @returns Semantic tokens
 */
export function getSemanticTokens(ast: TypeSpecScriptNode): SemanticToken[] {
  const ignore = -1;
  const defer = -2;

  const file = ast.file;
  const tokens = mapTokens();
  classifyNode(ast);
  return Array.from(tokens.values()).filter((t) => t.kind !== undefined);

  function mapTokens() {
    const tokens = new Map<number, SemanticToken>();
    const scanner = createScanner(file, () => {});
    const templateStack: [Token, TokenFlags][] = [];
    while (scanner.scan() !== Token.EndOfFile) {
      if (scanner.tokenFlags & TokenFlags.DocComment) {
        classifyDocComment({ pos: scanner.tokenPosition, end: scanner.position });
      } else {
        handleToken(scanner.token, scanner.tokenFlags, {
          pos: scanner.tokenPosition,
          end: scanner.position,
        });
      }
    }
    return tokens;

    function classifyDocComment(range: TextRange) {
      scanner.scanRange(range, () => {
        while (scanner.scanDoc() !== Token.EndOfFile) {
          const kind = classifyDocToken(scanner.token);
          if (kind === ignore) {
            continue;
          }
          tokens.set(scanner.tokenPosition, {
            kind: kind === defer ? undefined! : kind,
            pos: scanner.tokenPosition,
            end: scanner.position,
          });
        }
      });
    }

    function handleToken(token: Token, tokenFlags: TokenFlags, range: TextRange) {
      switch (token) {
        case Token.StringTemplateHead:
          templateStack.push([token, tokenFlags]);
          classifyStringTemplate(token, range);
          break;
        case Token.OpenBrace:
          // If we don't have anything on the template stack,
          // then we aren't trying to keep track of a previously scanned template head.
          if (templateStack.length > 0) {
            templateStack.push([token, tokenFlags]);
          }
          handleSimpleToken(token, range);
          break;
        case Token.CloseBrace:
          // If we don't have anything on the template stack,
          // then we aren't trying to keep track of a previously scanned template head.
          if (templateStack.length > 0) {
            const [lastToken, lastTokenFlags] = templateStack[templateStack.length - 1];

            if (lastToken === Token.StringTemplateHead) {
              token = scanner.reScanStringTemplate(lastTokenFlags);

              // Only pop on a TemplateTail; a TemplateMiddle indicates there is more for us.
              if (token === Token.StringTemplateTail) {
                templateStack.pop();
                classifyStringTemplate(token, {
                  pos: scanner.tokenPosition,
                  end: scanner.position,
                });
              } else {
                compilerAssert(
                  token === Token.StringTemplateMiddle,
                  "Should have been a template middle."
                );
                classifyStringTemplate(token, {
                  pos: scanner.tokenPosition,
                  end: scanner.position,
                });
              }
            } else {
              compilerAssert(lastToken === Token.OpenBrace, "Should have been an open brace");
              templateStack.pop();
            }
            break;
          }
          handleSimpleToken(token, range);
          break;
        default:
          handleSimpleToken(token, range);
      }
    }

    function handleSimpleToken(token: Token, range: TextRange) {
      const kind = classifyToken(scanner.token);
      if (kind === ignore) {
        return;
      }
      tokens.set(range.pos, {
        kind: kind === defer ? undefined! : kind,
        ...range,
      });
    }

    function classifyStringTemplate(
      token: Token.StringTemplateHead | Token.StringTemplateMiddle | Token.StringTemplateTail,
      range: TextRange
    ) {
      const stringStart = token === Token.StringTemplateHead ? range.pos : range.pos + 1;
      const stringEnd = token === Token.StringTemplateTail ? range.end : range.end - 2;

      if (stringStart !== range.pos) {
        tokens.set(range.pos, {
          kind: SemanticTokenKind.Operator,
          pos: range.pos,
          end: stringStart,
        });
      }
      tokens.set(stringStart, {
        kind: SemanticTokenKind.String,
        pos: stringStart,
        end: stringEnd,
      });
      if (stringEnd !== range.end) {
        tokens.set(stringEnd, {
          kind: SemanticTokenKind.Operator,
          pos: stringEnd,
          end: range.end,
        });
      }
    }
  }

  function classifyToken(token: Token): SemanticTokenKind | typeof defer | typeof ignore {
    switch (token) {
      case Token.Identifier:
        return defer;
      case Token.StringLiteral:
        return SemanticTokenKind.String;
      case Token.NumericLiteral:
        return SemanticTokenKind.Number;
      case Token.MultiLineComment:
      case Token.SingleLineComment:
        return SemanticTokenKind.Comment;
      default:
        if (isKeyword(token)) {
          return SemanticTokenKind.Keyword;
        }
        if (isPunctuation(token)) {
          return SemanticTokenKind.Operator;
        }
        return ignore;
    }
  }

  /** Classify tokens when scanning doc comment. */
  function classifyDocToken(token: Token): SemanticTokenKind | typeof defer | typeof ignore {
    switch (token) {
      case Token.NewLine:
      case Token.Whitespace:
        return ignore;
      case Token.DocText:
      case Token.Star:
      case Token.Identifier:
        return SemanticTokenKind.Comment;
      case Token.At:
        return defer;
      default:
        return ignore;
    }
  }

  function classifyNode(node: Node) {
    switch (node.kind) {
      case SyntaxKind.DirectiveExpression:
        classify(node.target, SemanticTokenKind.Keyword);
        break;
      case SyntaxKind.TemplateParameterDeclaration:
        classify(node.id, SemanticTokenKind.TypeParameter);
        break;
      case SyntaxKind.ModelProperty:
      case SyntaxKind.ObjectLiteralProperty:
      case SyntaxKind.UnionVariant:
        if (node.id) {
          classify(node.id, SemanticTokenKind.Property);
        }
        break;
      case SyntaxKind.AliasStatement:
        classify(node.id, SemanticTokenKind.Struct);
        break;
      case SyntaxKind.ModelStatement:
        classify(node.id, SemanticTokenKind.Struct);
        break;
      case SyntaxKind.ScalarStatement:
        classify(node.id, SemanticTokenKind.Type);
        break;
      case SyntaxKind.ScalarConstructor:
        classify(node.id, SemanticTokenKind.Function);
        break;
      case SyntaxKind.UsingStatement:
        if (node.name.kind === SyntaxKind.Identifier) {
          classify(node.name, SemanticTokenKind.Namespace);
        }
        break;
      case SyntaxKind.EnumStatement:
        classify(node.id, SemanticTokenKind.Enum);
        break;
      case SyntaxKind.UnionStatement:
        classify(node.id, SemanticTokenKind.Enum);
        break;
      case SyntaxKind.EnumMember:
        classify(node.id, SemanticTokenKind.EnumMember);
        break;
      case SyntaxKind.NamespaceStatement:
        classify(node.id, SemanticTokenKind.Namespace);
        break;
      case SyntaxKind.InterfaceStatement:
        classify(node.id, SemanticTokenKind.Interface);
        break;
      case SyntaxKind.OperationStatement:
        classify(node.id, SemanticTokenKind.Function);
        break;
      case SyntaxKind.DecoratorDeclarationStatement:
        classify(node.id, SemanticTokenKind.Function);
        break;
      case SyntaxKind.FunctionDeclarationStatement:
        classify(node.id, SemanticTokenKind.Function);
        break;
      case SyntaxKind.ConstStatement:
        classify(node.id, SemanticTokenKind.Variable);
        break;
      case SyntaxKind.FunctionParameter:
        classify(node.id, SemanticTokenKind.Parameter);
        break;
      case SyntaxKind.AugmentDecoratorStatement:
        classifyReference(node.targetType, SemanticTokenKind.Type);
        classifyReference(node.target, SemanticTokenKind.Macro);
        break;
      case SyntaxKind.DecoratorExpression:
        classifyReference(node.target, SemanticTokenKind.Macro);
        break;
      case SyntaxKind.CallExpression:
        classifyReference(node.target, SemanticTokenKind.Function);
        break;
      case SyntaxKind.TypeReference:
        classifyReference(node.target);
        break;
      case SyntaxKind.MemberExpression:
        classifyReference(node);
        break;
      case SyntaxKind.ProjectionStatement:
        classifyReference(node.selector);
        classify(node.id, SemanticTokenKind.Variable);
        break;
      case SyntaxKind.Projection:
        classify(node.directionId, SemanticTokenKind.Keyword);
        for (const modifierId of node.modifierIds) {
          classify(modifierId, SemanticTokenKind.Keyword);
        }
        break;
      case SyntaxKind.ProjectionParameterDeclaration:
        classifyReference(node.id, SemanticTokenKind.Parameter);
        break;
      case SyntaxKind.ProjectionCallExpression:
        classifyReference(node.target, SemanticTokenKind.Function);
        for (const arg of node.arguments) {
          classifyReference(arg);
        }
        break;
      case SyntaxKind.ProjectionMemberExpression:
        classifyReference(node.id);
        break;
      case SyntaxKind.DocParamTag:
      case SyntaxKind.DocTemplateTag:
        classifyDocTag(node.tagName, SemanticTokenKind.DocCommentTag);
        classifyOverride(node.paramName, SemanticTokenKind.Variable);
        break;
      case SyntaxKind.DocPropTag:
        classifyDocTag(node.tagName, SemanticTokenKind.DocCommentTag);
        classifyOverride(node.propName, SemanticTokenKind.Variable);
        break;
      case SyntaxKind.DocReturnsTag:
        classifyDocTag(node.tagName, SemanticTokenKind.DocCommentTag);
        break;
      case SyntaxKind.DocUnknownTag:
        classifyDocTag(node.tagName, SemanticTokenKind.Macro);
        break;
      case SyntaxKind.TemplateArgument:
        if (node.name) classify(node.name, SemanticTokenKind.TypeParameter);
        break;
      default:
        break;
    }
    visitChildren(node, classifyNode);
  }

  function classifyDocTag(node: IdentifierNode, kind: SemanticTokenKind) {
    classifyOverride(node, kind);
    const token = tokens.get(node.pos - 1); // Get the `@` token
    if (token) {
      token.kind = kind;
    }
  }

  function classify(node: IdentifierNode | StringLiteralNode, kind: SemanticTokenKind) {
    const token = tokens.get(node.pos);
    if (token && token.kind === undefined) {
      token.kind = kind;
    }
  }
  function classifyOverride(node: IdentifierNode | StringLiteralNode, kind: SemanticTokenKind) {
    const token = tokens.get(node.pos);
    if (token) {
      token.kind = kind;
    }
  }

  function classifyReference(node: Node, kind = SemanticTokenKind.Type) {
    switch (node.kind) {
      case SyntaxKind.MemberExpression:
        classifyIdentifier(node.base, SemanticTokenKind.Namespace);
        classifyIdentifier(node.id, kind);
        break;
      case SyntaxKind.ProjectionMemberExpression:
        classifyReference(node.base, SemanticTokenKind.Namespace);
        classifyIdentifier(node.id, kind);
        break;
      case SyntaxKind.TypeReference:
        classifyIdentifier(node.target, kind);
        break;
      case SyntaxKind.Identifier:
        classify(node, kind);
        break;
    }
  }

  function classifyIdentifier(node: Node, kind: SemanticTokenKind) {
    if (node.kind === SyntaxKind.Identifier) {
      classify(node, kind);
    }
  }
}
