---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Fix model file name for `@friendlyName` ARM-style template patterns (e.g. `@friendlyName("{name}TagsUpdate", Resource)` on `TagsUpdate<Resource>`). The instantiation now correctly receives the substituted name (e.g. `FooResourceTagsUpdate.cs`) from the compiler.
