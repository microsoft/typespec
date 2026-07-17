---
changeKind: internal
packages:
  - "@typespec/compiler"
  - "@typespec/tspd"
  - "@typespec/spector"
  - "@typespec/bundler"
---

Replace the `source-map-support` dependency with the native Node.js `process.setSourceMapsEnabled(true)` API in the CLI entrypoints.
