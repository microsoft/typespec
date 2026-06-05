---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix missing `using Microsoft.Extensions.Configuration;` in generated `ClientSettings` types when `BindCore` is moved to custom code. The type description references `IConfigurationSection`, so the namespace import is now always emitted.
