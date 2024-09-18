import { TSESLint, TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";
import { createRule } from "../utils.js";

const messages = {
  default: "Use context.call to call a TypeSpec decorator function.",
  suggestReplaceWithContextCall: "Replace with context.call",
};

export const callDecoratorRule = createRule<never[], keyof typeof messages>({
  create(context) {
    const parserServices = context.sourceCode.parserServices;
    if (parserServices === undefined || !parserServices.program) {
      return {};
    }
    const checker = parserServices.program.getTypeChecker();
    return {
      CallExpression(node) {
        if (node.callee.type === TSESTree.AST_NODE_TYPES.Identifier) {
          const functionName = node.callee.name;
          if (functionName.startsWith("$")) {
            const tsNode = parserServices.esTreeNodeToTSNodeMap?.get(node);
            if (tsNode === undefined) {
              return;
            }
            const signature = checker.getResolvedSignature(tsNode);
            if (signature === undefined) {
              return;
            }

            if (isTypeSpecFunctionSignature(checker, signature, tsNode)) {
              context.report({
                messageId: "default",
                node,
                suggest: [
                  {
                    messageId: "suggestReplaceWithContextCall",
                    fix: (fixer): TSESLint.RuleFix[] => {
                      return [
                        fixer.replaceText(node.callee, `context.call`),
                        fixer.replaceText(node.arguments[0], functionName),
                      ];
                    },
                  },
                ],
              });
            }
          }
        }
      },
    };
  },
  name: "call-decorator",
  meta: {
    docs: {
      description: "Calling a TypeSpec decorator from JS/TS code should be done with context.call",
    },
    hasSuggestions: true,
    messages,
    type: "suggestion",
    schema: [],
  },
  defaultOptions: [],
});

function isTypeSpecFunctionSignature(
  checker: ts.TypeChecker,
  signature: ts.Signature,
  tsNode: ts.Node,
): boolean {
  if (signature.parameters.length < 2) {
    return false;
  }
  const contextParameter = signature.parameters[0];
  const contextParamType = checker.getTypeOfSymbolAtLocation(contextParameter, tsNode);
  if (
    (contextParamType.flags & ts.TypeFlags.StructuredType &&
      contextParamType.aliasSymbol?.name === "DecoratorContext") ||
    contextParamType.symbol?.name === "DecoratorContext"
  ) {
    return true;
  }
  return false;
}
