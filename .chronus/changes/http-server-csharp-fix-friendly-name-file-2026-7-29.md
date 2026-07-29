---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Fix generated model file name when `@friendlyName` contains unresolved template parameter placeholders such as `{name}` (e.g. `{name}TagsUpdate`). The file is now named using the PascalCase expansion of the placeholder (e.g. `NameTagsUpdate.cs`) instead of the literal `{name}TagsUpdate.cs`.
