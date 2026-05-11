---
changeKind: fix
packages:
  - "@typespec/playground"
---

Fix line-level diff highlighting not appearing in the playground output editor, and reduce typing freezes by coalescing recompilations triggered while a compile is already running.
