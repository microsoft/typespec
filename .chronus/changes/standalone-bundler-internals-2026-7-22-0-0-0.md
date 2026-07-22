---
changeKind: internal
packages:
  - "@typespec/bundler"
---

Exclude the node-only `./internals/*` sub-entrypoints (e.g. `./internals/standalone`) from the browser bundle while keeping the browser-safe `./internals/prettier-formatter` export, so bundling libraries for the playground/web no longer pulls in the CLI runner and Node built-ins.
