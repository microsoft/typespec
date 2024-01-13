require("@typespec/eslint-config-typespec/patch/modern-module-resolution");

module.exports = {
  extends: "@typespec/eslint-config-typespec",
  parserOptions: { tsconfigRootDir: __dirname, project: "tsconfig.config.json" },
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
