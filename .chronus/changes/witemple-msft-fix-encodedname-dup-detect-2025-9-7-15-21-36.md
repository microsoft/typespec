---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Addressed a bug that could cause duplicate `@encodedName` applications to be detected when none actually exist.