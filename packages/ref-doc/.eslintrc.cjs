require("@typespec/eslint-config-typespec/patch/modern-module-resolution");

module.exports = {
  plugins: [],
  extends: ["@typespec/eslint-config-typespec"],
  parserOptions: { tsconfigRootDir: __dirname },
};
