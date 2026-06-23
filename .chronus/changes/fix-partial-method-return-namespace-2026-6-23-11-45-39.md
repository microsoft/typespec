---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix partial method customization emitting return types with no namespace (`global::.TypeName`) when the declaration references a type generated into the same assembly. The generated implementation now uses the generator's resolved return type.
