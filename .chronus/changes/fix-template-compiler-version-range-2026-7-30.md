---
changeKind: fix
packages:
  - "@typespec/compiler"
---

`tsp init` template `compilerVersion` field now supports semver ranges (e.g., `^0.50.0`). Plain versions like `1.2.3` continue to work as `>=1.2.3` for backward compatibility.
