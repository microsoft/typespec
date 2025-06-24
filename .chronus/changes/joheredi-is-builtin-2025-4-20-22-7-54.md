---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Introduce builtin.is(type: Type): boolean, which returns true for any type defined in the global TypeSpec namespace (i.e. built-in/standard library types).