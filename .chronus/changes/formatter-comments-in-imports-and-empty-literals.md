---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix the formatter crashing or producing invalid code for comments inside an `import` statement or an empty object (`#{}`) or array (`#[]`) literal.
