---
changeKind: fix
packages:
  - "@typespec/http"
---

Replace optional param validation requiring use with path expansion and replace with a warning when the resulting url might have a double `/`
