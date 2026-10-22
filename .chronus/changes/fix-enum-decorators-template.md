---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix decorators being skipped on enums first referenced from template declarations, including references to enum members.
