// @ts-check
import eslint from "@eslint/js";
import deprecation from "eslint-plugin-deprecation";
import unicorn from "eslint-plugin-unicorn";
import vitest from "eslint-plugin-vitest";
import { dirname } from "path";
import tsEslint from "typescript-eslint";
import { fileURLToPath } from "url";

export default tsEslint.config(
  {
    ignores: [
      "**/dist/**/*",
      "**/.temp/**/*",
      "**/generated-defs/*",
      "**/website/build/**/*",
      "**/.docusaurus/**/*",
      "packages/compiler/templates/**/*", // Ignore the templates which might have invalid code and not follow exactly our rules.
      // TODO: enable
      "**/.scripts/**/*",
      "eng/scripts/**/*",
      "packages/*/scripts/**/*",
    ],
  },
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  {
    languageOptions: {
      parserOptions: {
        project: "./tsconfig.json",
        tsconfigRootDir: dirname(fileURLToPath(import.meta.url)),
      },
    },
    plugins: {
      deprecation,
      unicorn,
    },
    rules: {
      /**
       * Typescript plugin overrides
       */
      "@typescript-eslint/no-non-null-assertion": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-inferrable-types": "off",
      "@typescript-eslint/no-empty-function": "off",
      "@typescript-eslint/no-empty-interface": "off",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { varsIgnorePattern: "^_", argsIgnorePattern: ".*", ignoreRestSiblings: true },
      ],
      "@typescript-eslint/no-floating-promises": "error",

      // This rule is bugged https://github.com/typescript-eslint/typescript-eslint/issues/6538
      "@typescript-eslint/no-misused-promises": "off",

      /**
       * Unicorn
       */
      "deprecation/deprecation": ["warn"],

      /**
       * Unicorn
       */
      "unicorn/filename-case": ["error", { case: "kebabCase" }],

      /**
       * Core
       */
      "no-inner-declarations": "off",
      "no-empty": "off",
      "no-constant-condition": "off",
      "no-case-declarations": "off",
      "no-ex-assign": "off",
      "no-undef": "off",
      "prefer-const": [
        "warn",
        {
          destructuring: "all",
        },
      ],
      eqeqeq: ["warn", "always", { null: "ignore" }],

      // Do not want console.log left from debugging or using console.log for logging. Use the program logger.
      "no-console": "warn",

      // Symbols should have a description so it can be serialized.
      "symbol-description": "warn",
    },
  },
  {
    /**
     * Test files specific rules
     */
    files: ["**/*.test.ts"],
    plugins: { vitest },
    rules: {
      "vitest/no-focused-tests": "warn",
      "vitest/no-identical-title": "error",
      "vitest/no-commented-out-tests": "warn",
      "vitest/no-import-node-test": "warn",
      "vitest/require-local-test-context-for-concurrent-snapshots": "warn",
      "vitest/valid-describe-callback": "warn",
      "vitest/valid-expect": "warn",
      "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
    },
  }
);
