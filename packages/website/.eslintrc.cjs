require("@cadl-lang/eslint-config-cadl/patch/modern-module-resolution");

module.exports = {
  extends: "@cadl-lang/eslint-config-cadl",
  parserOptions: { tsconfigRootDir: __dirname },
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
