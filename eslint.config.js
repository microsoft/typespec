// @ts-check
import eslint from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import unicorn from "eslint-plugin-unicorn";
import vitest from "eslint-plugin-vitest";
import tsEslint from "typescript-eslint";

/** Config that will apply to all files */
const allFilesConfig = tsEslint.config({
  plugins: {
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

    // This rule is bugged https://github.com/typescript-eslint/typescript-eslint/issues/6538
    "@typescript-eslint/no-misused-promises": "off",
    "@typescript-eslint/no-unused-expressions": [
      "warn",
      { allowShortCircuit: true, allowTernary: true },
    ],

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
});

/** Config that will apply to all typescript files only
 * @param {string} root
 */
export function getTypeScriptProjectRules(root) {
  return tsEslint.config({
    files: ["**/packages/*/src/**/*.ts", "**/packages/*/src/**/*.tsx"],
    ignores: [
      "**/packages/http-client-csharp/**/*",
      "**/packages/http-client-java/**/*",
      "**/packages/http-client-python/**/*",
    ], // Ignore isolated modules
    plugins: {},
    languageOptions: {
      parserOptions: {
        projectService: {
          allowDefaultProject: ["packages/*/vitest.config.ts"],
        },
        tsconfigRootDir: root,
      },
    },
    rules: {
      // Only put rules here that need typescript project information
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-deprecated": "warn",
    },
  });
}

/** Config that will apply to all test files only */
const testFilesConfig = tsEslint.config({
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
    "vitest/consistent-test-it": ["warn", { fn: "it" }],
    "vitest/no-done-callback": ["warn"],
    "vitest/no-duplicate-hooks": ["warn"],
    "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
  },
});

const jsxFilesConfig = tsEslint.config({
  files: ["**/*.tsx"],
  plugins: { "react-hooks": reactHooks },
  rules: {
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
  },
});

export const TypeSpecCommonEslintConfigs = [
  eslint.configs.recommended,
  ...tsEslint.configs.recommended,
  ...allFilesConfig,
  ...jsxFilesConfig,
  ...testFilesConfig,
];

export default tsEslint.config(
  {
    ignores: [
      "**/dist/**/*",
      "**/.temp/**/*",
      "**/generated-defs/*",
      "**/website/build/**/*",
      "**/.docusaurus/**/*",
      "packages/compiler/templates/**/*", // Ignore the templates which might have invalid code and not follow exactly our rules.
      "**/venv/**/*", // Ignore python virtual env
      // TODO: enable
      "**/.scripts/**/*",
      "eng/tsp-core/scripts/**/*",
      "eng/common/scripts/**/*",
      "packages/*/scripts/**/*",
    ],
  },
  ...TypeSpecCommonEslintConfigs,
  ...getTypeScriptProjectRules(import.meta.dirname),
);
