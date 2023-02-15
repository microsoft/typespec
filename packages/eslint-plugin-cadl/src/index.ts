import { callDecoratorRule } from "./rules/call-decorator.js";

export const rules = {
  "call-decorator": callDecoratorRule,
};

export const configs = {
  recommended: {
    rules: {
      "@typespec/call-decorator": "warn",
    },
  },
};
