---
changeKind: feature
packages:
  - "@typespec/http-client-csharp"
---

Add a `CustomCodeAttributeDefinition` base `TypeProvider` that derived generators can inherit from when contributing custom-code attribute providers via `CodeModelGenerator.AddCustomCodeAttributeProvider`. The base type disables the source-input customization views (`CustomCodeView`/`LastContractView`), so contributed attribute definitions no longer evaluate `SourceInputModel` before it is initialized.

```csharp
public class CodeGenResourceDataAttributeDefinition : CustomCodeAttributeDefinition
{
    protected override string BuildName() => "CodeGenResourceDataAttribute";
    // ...
}
```
