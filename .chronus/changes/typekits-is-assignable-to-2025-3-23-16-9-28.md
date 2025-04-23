---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Removes `program.checker.isTypeAssignableTo`. Use one of the following typekits instead:
- `$(program).type.isAssignableTo`
- `$(program).value.isAssignableTo`
- `$(program).entity.isAssignableTo`
