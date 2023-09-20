module.exports = require(
  process.env.TYPESPEC_DEVELOPMENT_MODE ? "./dist-dev/src/extension.js" : "./dist/src/extension.js"
);
