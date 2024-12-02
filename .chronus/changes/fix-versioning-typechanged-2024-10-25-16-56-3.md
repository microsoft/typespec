---
changeKind: fix
packages:
  - "@typespec/versioning"
---

Fixes diagnostics for @typeChangedFrom to properly detect when an incompatible version is referenced inside of a template or union.