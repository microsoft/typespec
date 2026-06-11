import { defineConfig } from "oxlint";

/** Config that applies to all files */
const allFilesRules = {
  // Core correctness rules
  "constructor-super": "error",
  "for-direction": "error",
  "getter-return": "error",
  "no-async-promise-executor": "error",
  "no-class-assign": "error",
  "no-compare-neg-zero": "error",
  "no-cond-assign": "error",
  "no-const-assign": "error",
  "no-constant-binary-expression": "error",
  "no-debugger": "error",
  "no-delete-var": "error",
  "no-dupe-class-members": "error",
  "no-dupe-else-if": "error",
  "no-dupe-keys": "error",
  "no-duplicate-case": "error",
  "no-empty-character-class": "error",
  "no-empty-pattern": "error",
  "no-empty-static-block": "error",
  "no-extra-boolean-cast": "error",
  "no-fallthrough": "error",
  "no-func-assign": "error",
  "no-global-assign": "error",
  "no-import-assign": "error",
  "no-invalid-regexp": "error",
  "no-irregular-whitespace": "error",
  "no-loss-of-precision": "error",
  "no-misleading-character-class": "error",
  "no-new-native-nonconstructor": "error",
  "no-nonoctal-decimal-escape": "error",
  "no-obj-calls": "error",
  "no-prototype-builtins": "error",
  "no-redeclare": "error",
  "no-regex-spaces": "error",
  "no-self-assign": "error",
  "no-setter-return": "error",
  "no-shadow-restricted-names": "error",
  "no-sparse-arrays": "error",
  "no-this-before-super": "error",
  "no-unassigned-vars": "error",
  "no-unexpected-multiline": "error",
  "no-unreachable": "error",
  "no-unsafe-finally": "error",
  "no-unsafe-negation": "error",
  "no-unused-labels": "error",
  "no-unused-private-class-members": "error",
  "no-useless-backreference": "error",
  "no-useless-catch": "error",
  "no-useless-escape": "error",
  "no-with": "error",
  "preserve-caught-error": "error",
  "require-yield": "error",
  "use-isnan": "error",
  "valid-typeof": "error",
  "no-array-constructor": "error",

  // Disabled rules (intentional patterns in codebase)
  "no-control-regex": "off",
  "no-unsafe-optional-chaining": "off",

  // Warnings
  "no-unused-vars": [
    "warn",
    {
      varsIgnorePattern: "^_",
      argsIgnorePattern: ".*",
      ignoreRestSiblings: true,
      caughtErrorsIgnorePattern: ".*",
    },
  ],
  "no-unused-expressions": ["warn", { allowShortCircuit: true, allowTernary: true }],
  "prefer-const": ["warn", { destructuring: "all" }],
  eqeqeq: ["warn", "always", { null: "ignore" }],
  "no-console": "warn",
  "symbol-description": "warn",

  // Unicorn - disabled globally, enabled per-override for TS files
  "unicorn/filename-case": "off",

  // TypeScript plugin rules
  "typescript/ban-ts-comment": "error",
  "typescript/no-duplicate-enum-values": "error",
  "typescript/no-extra-non-null-assertion": "error",
  "typescript/no-misused-new": "error",
  "typescript/no-namespace": "error",
  "typescript/no-non-null-asserted-optional-chain": "error",
  "typescript/no-require-imports": "error",
  "typescript/no-this-alias": "error",
  "typescript/no-unnecessary-type-constraint": "error",
  "typescript/no-unsafe-declaration-merging": "error",
  "typescript/no-unsafe-function-type": "error",
  "typescript/no-wrapper-object-types": "error",
  "typescript/prefer-as-const": "error",
  "typescript/prefer-namespace-keyword": "error",
  "typescript/triple-slash-reference": "error",
} as const;

/** Rules for TypeScript files — disables JS-only rules superseded by TS compiler */
const typescriptFileOverride = {
  files: ["**/*.ts", "**/*.tsx", "**/*.mts", "**/*.cts"],
  rules: {
    "constructor-super": "off",
    "getter-return": "off",
    "no-class-assign": "off",
    "no-const-assign": "off",
    "no-dupe-class-members": "off",
    "no-dupe-keys": "off",
    "no-func-assign": "off",
    "no-import-assign": "off",
    "no-new-native-nonconstructor": "off",
    "no-obj-calls": "off",
    "no-redeclare": "off",
    "no-setter-return": "off",
    "no-this-before-super": "off",
    "no-unreachable": "off",
    "no-unsafe-negation": "off",
    "no-var": "error",
    "no-with": "off",
    "prefer-rest-params": "error",
    "prefer-spread": "error",
    "unicorn/filename-case": ["error", { case: "kebabCase" }],
  },
} as const;

/** React hooks rules for JSX files */
const jsxFilesOverride = {
  files: ["**/*.tsx"],
  excludeFiles: [
    "**/packages/emitter-framework/src/**/*",
    "**/packages/http-client-js/**/*",
    "**/packages/http-server-csharp/**/*",
  ],
  plugins: ["react"],
  rules: {
    "react/rules-of-hooks": "error",
    "react/exhaustive-deps": "warn",
  },
} as const;

/** Test file rules */
const testFilesOverride = {
  files: ["**/*.test.ts"],
  plugins: ["vitest"],
  rules: {
    "vitest/no-focused-tests": "warn",
    "vitest/no-identical-title": "error",
    "vitest/no-commented-out-tests": "warn",
    "vitest/no-import-node-test": "warn",
    "vitest/require-local-test-context-for-concurrent-snapshots": "warn",
    "vitest/valid-describe-callback": "warn",
    "vitest/valid-expect": "warn",
    "vitest/consistent-test-it": ["warn", { fn: "it" }],
    "vitest/no-duplicate-hooks": ["warn"],
    "typescript/no-non-null-asserted-optional-chain": "off",
  },
} as const;

/**
 * Shared TypeSpec oxlint configs — can be reused by downstream repos (e.g., typespec-azure).
 */
export const TypeSpecCommonOxlintConfigs = {
  allFilesRules,
  typescriptFileOverride,
  jsxFilesOverride,
  testFilesOverride,
};

export default defineConfig({
  plugins: ["typescript", "unicorn"],
  categories: {
    correctness: "off",
  },
  env: {
    builtin: true,
  },
  ignorePatterns: [
    "**/dist/**/*",
    "**/dist-test/**/*",
    "**/.temp/**/*",
    "**/temp/**/*",
    "**/generated-defs/*",
    "**/__snapshots__/*",
    "**/.astro/*",
    "**/website/build/**/*",
    "**/.astro/**/*",
    "**/.docusaurus/**/*",
    "website/src/assets/**/*",
    "packages/compiler/templates/**/*",
    "packages/typespec-vscode/templates/**/*",
    "packages/http-client-js/test/e2e/generated",
    "packages/http-client-js/sample/output/**/*",
    "packages/http-server-js/test/e2e/generated",
    "**/venv/**/*",
    "**/.vscode-test-web/**/*",
    "packages/typespec-vscode/swagger-ui/swagger-ui*",
    "**/*.astro",
    "**/.scripts/**/*",
    "eng/tsp-core/scripts/**/*",
    "eng/common/scripts/**/*",
    "packages/*/scripts/**/*",
  ],
  rules: allFilesRules,
  overrides: [
    typescriptFileOverride,
    jsxFilesOverride,
    testFilesOverride,
    // Framework-required PascalCase filenames
    {
      files: ["website/src/components/docusaurus/**/*.ts", "website/src/pages/**/*.ts"],
      rules: {
        "unicorn/filename-case": "off",
      },
    },
  ],
});
