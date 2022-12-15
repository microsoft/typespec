require("@cadl-lang/eslint-config-cadl/patch/modern-module-resolution");

module.exports = {
  plugins: [],
  extends: ["@cadl-lang/eslint-config-cadl"],
  parserOptions: { tsconfigRootDir: __dirname },
};
