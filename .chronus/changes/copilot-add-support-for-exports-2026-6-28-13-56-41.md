---
changeKind: fix
packages:
  - "@typespec/compiler"
---

`tsp compile .` now resolves the entrypoint from `exports["."]["typespec"]` in package.json when `tspMain` is not set