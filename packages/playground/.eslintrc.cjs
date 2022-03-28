require("@cadl-lang/eslint-config-cadl/patch/modern-module-resolution");

module.exports = {
  extends: "@cadl-lang/eslint-config-cadl",
  parserOptions: { project: "./tsconfig.json" },
  rules: {
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          arguments: false, // too much noise when adding async event listeners
        },
      },
    ],
  },
};
