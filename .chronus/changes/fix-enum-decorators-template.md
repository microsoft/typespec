---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix decorators being skipped when concrete types are first referenced from template declarations, including references through model properties, union variants, and enum members.
