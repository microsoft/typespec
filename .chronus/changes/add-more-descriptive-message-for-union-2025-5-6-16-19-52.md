---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Improved the error message for the `@pattern` decorator when applied to a `union` type. The new message is more descriptive and helps users understand how to correctly define string-compatible union types.
