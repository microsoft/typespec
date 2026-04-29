// @ts-check
// Standalone eslint config for http-client-python package
// This config is used in CI where monorepo dependencies may not be available
import eslint from "@eslint/js";
import { dirname } from "path";
import tsEslint from "typescript-eslint";
import { fileURLToPath } from "url";

const root = dirname(dirname(dirname(dirname(fileURLToPath(import.meta.url)))));

export default [
  {
    ignores: ["**/dist/**/*", "**/node_modules/**/*"],
  },
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        tsconfigRootDir: root,
      },
    },
    rules: {
      // TypeScript plugin overrides
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-empty-object-type": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          varsIgnorePattern: "^_",
          argsIgnorePattern: ".*",
          ignoreRestSiblings: true,
          caughtErrorsIgnorePattern: ".*",
        },
      ],
      "@typescript-eslint/no-unused-expressions": [
        "warn",
        { allowShortCircuit: true, allowTernary: true },
      ],

      // Core rules
      "no-inner-declarations": "off",
      "no-empty": "off",
      "no-constant-condition": "off",
      "no-case-declarations": "off",
      "no-ex-assign": "off",
      "no-undef": "off",
      "no-useless-assignment": "error",
      "prefer-const": [
        "warn",
        {
          destructuring: "all",
        },
      ],
      eqeqeq: ["warn", "always", { null: "ignore" }],
      "no-console": "warn",
      "symbol-description": "warn",
    },
  },
];
