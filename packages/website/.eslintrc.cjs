require("@typespec/eslint-config-typespec/patch/modern-module-resolution");

module.exports = {
  extends: ["@typespec/eslint-config-typespec"],
  parserOptions: { tsconfigRootDir: __dirname },
  env: {
    browser: true,
  },
  rules: {
    "@typescript-eslint/no-var-requires": "off",
  },
};
