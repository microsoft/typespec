---
changeKind: feature
packages:
  - "@typespec/http-client-csharp"
---

Support resolving `@alternateType` types from referenced C# projects.

```typespec
@alternateType({ identity: "Contoso.Shared.Widget" }, "csharp")
model Widget {}
```
