---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Make `ModelProvider.BuildBaseTypeProvider` and `ModelProvider.BuildBaseModelProvider` `protected virtual` so emitters that override `BuildBaseType` can keep `BaseType`, `BaseTypeProvider`, and `BaseModelProvider` consistent. Previously, overriding `BuildBaseType` could leave `BaseModelProvider` walking the original `InputModelType.BaseModel`, producing a base model chain that did not match the generated C# class hierarchy.
