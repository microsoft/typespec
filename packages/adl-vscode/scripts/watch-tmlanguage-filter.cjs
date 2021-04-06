const { basename } = require("path");
module.exports = function (file) {
  return basename(file) === "tmlanguage.js";
};
