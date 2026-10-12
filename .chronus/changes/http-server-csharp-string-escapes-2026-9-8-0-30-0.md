---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Escape strings written into generated C#, such as a `@pattern` using `\d`, string defaults, enum values and parameter names.
