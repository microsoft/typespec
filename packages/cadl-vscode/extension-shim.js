module.exports = require(process.env.CADL_DEVELOPMENT_MODE
  ? "./dist-dev/src/extension.js"
  : "./dist/src/extension.js");
