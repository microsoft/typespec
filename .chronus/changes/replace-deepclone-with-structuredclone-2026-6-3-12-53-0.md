---
changeKind: deprecation
packages:
  - "@typespec/compiler"
---

Deprecated `deepClone` utility in favor of `structuredClone`. All internal usages have been replaced with the native `structuredClone` API.
