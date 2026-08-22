---
changeKind: feature
packages:
  - "@typespec/emitter-framework"
---

Let emitters author the C# declaration components instead of forking them

- `ClassDeclaration` accepts an explicit `properties` list and extra members as `children`.
- `Property` accepts every Alloy property prop, plus `name` and `csharpType` overrides.
- `EnumDeclaration` accepts an explicit `members` list and a `jsonAttributes` prop.
- `JsonConverter` accepts `doc`, access modifiers, extra members, an explicit `csharpType`, and a `readReturns` override.

```tsx
<ClassDeclaration type={model} properties={model.properties.values().filter(isVisible)} partial>
  <Constructor />
</ClassDeclaration>
```
