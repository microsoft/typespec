---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix `Expected type.` internal compiler error when a string template interpolates a function call that references a template parameter on a template declaration (e.g. `@doc("${myFn(T)}") model Crud<T extends Reflection.Model> {}`). The deferred function call now defers the whole template, which is evaluated at instantiation.
