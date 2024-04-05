require("@typespec/eslint-config-typespec/patch/modern-module-resolution");

module.exports = {
  // Disabled until https://github.com/microsoft/typespec/issues/3121
  // plugins: ["@typespec/eslint-plugin-typespec"],
  extends: [
    "@typespec/eslint-config-typespec",
    // "plugin:@typespec/eslint-plugin-typespec/recommended",
  ],
  parserOptions: { tsconfigRootDir: __dirname },
};
