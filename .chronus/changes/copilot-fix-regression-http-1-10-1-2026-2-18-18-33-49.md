---
changeKind: fix
packages:
  - "@typespec/http"
---

Fix route joining to preserve trailing `/` when it would not result in `//`