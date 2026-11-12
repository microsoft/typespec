---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Linter rules can opt in to `reportAtUsage` to have diagnostics on library declarations reported at the project node that uses them, instead of being silently dropped. A report can also pass an explicit `useSite`.
