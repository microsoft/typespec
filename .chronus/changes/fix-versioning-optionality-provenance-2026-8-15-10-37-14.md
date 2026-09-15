---
changeKind: fix
packages:
  - "@typespec/versioning"
---

Ignore inherited optionality history when a derived property structurally changes optionality, avoiding incorrect diagnostics and preserving the transformed optionality in version snapshots.