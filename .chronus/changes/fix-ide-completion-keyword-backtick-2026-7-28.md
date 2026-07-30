---
changeKind: fix
packages:
  - "@typespec/compiler"
---

IDE completion no longer adds unnecessary backticks when completing keyword identifiers in positions where they are allowed (model properties, object literal properties, member expressions).
