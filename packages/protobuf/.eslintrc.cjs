require("@typespec/eslint-config-typespec/patch/modern-module-resolution");

module.exports = {
  plugins: ["@typespec/eslint-plugin"],
  extends: ["@typespec/eslint-config-typespec", "plugin:@typespec/eslint-plugin/recommended"],
  parserOptions: { tsconfigRootDir: __dirname },
};
