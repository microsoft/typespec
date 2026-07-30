---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix false-positive name resolution failure when a `using` statement references a namespace whose first segment coincides with an intermediate segment in a multi-segment blockless namespace declaration (e.g. `using TypeSpec.Http` in a file with `namespace _Specs_.TypeSpec.Bar;`). The intermediate namespace segment `_Specs_.TypeSpec` was incorrectly shadowing the global `TypeSpec` namespace through the `inScopeNamespaces` lookup.
