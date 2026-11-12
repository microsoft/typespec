---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Linter rules can opt in to `reportAtUsage` to have diagnostics on library declarations reported on the node in the project responsible for them (a template argument the user wrote, or a spread, `is` or intersection operand that composed it) instead of being silently dropped. Library-internal declarations are still not reported.
