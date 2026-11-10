---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix `enumMember` and `exitEnumMember` semantic navigation callbacks so linter rules can validate enum members. Scoped navigation uses the parent enum's namespace to avoid visiting members outside the requested scope.
