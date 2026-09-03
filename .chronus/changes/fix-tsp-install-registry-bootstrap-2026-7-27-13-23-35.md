---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Allow `tsp install` to download package managers from npm-compatible registry mirrors by resolving versions from package metadata instead of version-specific manifest endpoints.