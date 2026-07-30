---
changeKind: fix
packages:
  - "@typespec/compiler"
---

`tsp compile .` now resolves the entrypoint from `exports["."]["typespec"]` in package.json, taking precedence over the legacy `tspMain` field