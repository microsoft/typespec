---
changeKind: fix
packages:
  - "@typespec/versioning"
---

Preserve transformed property optionality in version snapshots and skip incompatible optionality diagnostics when the property differs from its original declaration, without special-casing transformation helpers.