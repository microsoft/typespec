import { ESLintUtils } from "@typescript-eslint/utils";

// TODO get rule url
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/microsoft/cadl/tree/main/packages/eslint-plugin-cadl/docs/rules/${name}.md`
);
