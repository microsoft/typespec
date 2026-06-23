---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix partial method customization emitting return types without a namespace (`global::.TypeName`) and appending `0` to parameter names. The generated partial implementation now uses the generator's resolved return type and parameter types instead of the customer's parsed declaration types.
