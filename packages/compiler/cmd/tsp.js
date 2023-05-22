#!/usr/bin/env node

// WARNING: Be careful editing this file. For the node version runtime
// check below to work, we must avoid using JS features that would trigger a
// failure at parse time before it runs.
//
// We deliberately do not use `const/let`, `?.`, and backticked string
// templates, and we obfuscate the dynamic import to avoid triggering a
// reserved word.
//
// This has been tested back to Node.js v0.12.18

var nodeVersion = Number(
  process.versions && process.versions.node && process.versions.node.split(".")[0]
);

if (!nodeVersion || nodeVersion < 16) {
  console.log("error: TypeSpec requires Node.js version 16.0 or higher.");
  process.exit(1);
}

function _import(module) {
  var f = new Function("module", "return import(module)");
  return f(module);
}

_import("../dist/cmd/runner.js").then(function (r) {
  r.runScript("entrypoints/cli.js", "dist/core/cli/cli.js");
});
