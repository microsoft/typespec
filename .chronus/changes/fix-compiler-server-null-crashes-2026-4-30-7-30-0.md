---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix server crashes caused by undefined symbol declarations: add null checks for `getSymNode()` in hover, completion, type-details, and type-signature handlers, and use fallback name for empty DocumentSymbol names
