import { callDecoratorRule } from "./rules/call-decorator.js";

export const rules = {
  "call-decorator": callDecoratorRule,
};

export const configs = {
  recommended: {
    rules: {
      "@cadl-lang/call-decorator": "warn",
    },
  },
};
