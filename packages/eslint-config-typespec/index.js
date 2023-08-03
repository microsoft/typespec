module.exports = {
  parser: "@typescript-eslint/parser",
  parserOptions: { project: "./tsconfig.json" },
  plugins: ["@typescript-eslint/eslint-plugin", "prettier", "unicorn", "mocha", "deprecation"],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended", "prettier"],
  env: {
    node: true,
    es2021: true,
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
     * Mocha
     */
    "mocha/no-identical-title": "error",
    "mocha/no-nested-tests": "error",
    "mocha/no-empty-description": "error",
    "mocha/no-exclusive-tests": "warn",

    /**
     * Core
     */
    "no-inner-declarations": "off",
    "no-empty": "off",
    "no-constant-condition": "off",
    "no-case-declarations": "off",
    "no-ex-assign": "off",
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
  ignorePatterns: ["dist/**/*", "dist-dev/**/*"],
  overrides: [
    {
      files: ["test/**/*"],
      rules: {
        "@typescript-eslint/no-non-null-asserted-optional-chain": "off",
      },
    },
  ],
};
