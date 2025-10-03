---
changeKind: fix
packages:
  - "@typespec/rest"
---

Fix crash when resource would recursively reference itself via `@parentResource`
