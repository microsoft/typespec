require("@typespec/eslint-config-typespec/patch/modern-module-resolution");

module.exports = {
  extends: "@typespec/eslint-config-typespec",
  parserOptions: { tsconfigRootDir: __dirname },
  plugins: ["deprecation"],
  rules: {
    "deprecation/deprecation": "warn",
  },
  ignorePatterns: ["./venv/"],
};
