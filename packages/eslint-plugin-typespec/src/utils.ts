import { ESLintUtils } from "@typescript-eslint/utils";

// TODO get rule url
export const createRule = ESLintUtils.RuleCreator(
  (name) =>
    `https://github.com/microsoft/typespec/tree/main/packages/eslint-plugin-typespec/docs/rules/${name}.md`,
);
