import { createRule } from "../utils.js";

const messages = {
  default: "Use context.call to call a decorator function.",
};

export const callDecoratorRule = createRule<never[], keyof typeof messages>({
  create(context) {
    return {
      FunctionDeclaration(node) {
        if (node.id != null) {
          if (/^[a-z]/.test(node.id.name)) {
            context.report({
              messageId: "default",
              node: node.id,
            });
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
