---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix crash when marshaling `@example` values with large integers exceeding JavaScript safe integer range.
