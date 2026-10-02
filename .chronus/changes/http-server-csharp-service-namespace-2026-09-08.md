---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Use the namespace declared with `@service` as the generated C# service namespace, even when an imported or unrelated namespace is encountered first.
