import { ESLintUtils, TSESTree } from "@typescript-eslint/utils";
import * as ts from "typescript";
import { createRule } from "../utils.js";

const messages = {
  default: "Use context.call to call a decorator function.",
};

export const callDecoratorRule = createRule<never[], keyof typeof messages>({
  create(context) {
    const parserServices = ESLintUtils.getParserServices(context);
    const checker = parserServices.program.getTypeChecker();
    return {
      CallExpression(node) {
        if (node.callee.type === TSESTree.AST_NODE_TYPES.Identifier) {
          if (node.callee.name.startsWith("$")) {
            const tsNode = parserServices.esTreeNodeToTSNodeMap.get(node);

            const signature = checker.getResolvedSignature(tsNode);
            if (signature === undefined) {
              return;
            }

            if (isCadlFunctionSignature(checker, signature, tsNode)) {
              context.report({
                messageId: "default",
                node,
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
      description: "Calling a Cadl decorator from JS/TS code should be done with context.call",
      recommended: "warn",
    },
    messages,

    type: "suggestion",
    schema: [],
  },
  defaultOptions: [],
});

function isCadlFunctionSignature(
  checker: ts.TypeChecker,
  signature: ts.Signature,
  tsNode: ts.Node
): boolean {
  if (signature.parameters.length < 2) {
    return false;
  }
  const contextParameter = signature.parameters[0];
  const contextParamType = checker.getTypeOfSymbolAtLocation(contextParameter, tsNode);
  if (
    contextParamType.flags & ts.TypeFlags.StructuredType &&
    contextParamType.symbol.name === "DecoratorContext"
  ) {
    return true;
  }
  return false;
}
