require("@cadl-lang/eslint-config-cadl/patch/modern-module-resolution");

module.exports = {
  extends: ["@cadl-lang/eslint-config-cadl"],
  parserOptions: { tsconfigRootDir: __dirname },
  env: {
    browser: true,
  },
  rules: {
    "@typescript-eslint/no-var-requires": "off",
  },
};
