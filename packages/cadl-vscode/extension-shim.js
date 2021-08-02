module.exports = require(process.env.CADL_DEVELOPMENT_MODE
  ? "./dist-dev/extension.js"
  : "./dist/extension.js");
