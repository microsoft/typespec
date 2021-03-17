module.exports = require(process.env.ADL_DEVELOPMENT_MODE
  ? "./dist-dev/extension.js"
  : "./dist/extension.js");
