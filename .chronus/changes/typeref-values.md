---
changeKind: feature
packages:
  - "@typespec/compiler"
  - "@typespec/tspd"
---

Add experimental `typeref(Type)` for referencing types from metadata values. Its result has type `TypeRef<T>`, where `T` is the referenced type. Use `TypeRef` to accept any type reference, or `TypeRef<T>` to constrain its target. JavaScript implementations and generated signatures use `TypeRefValue`, whose `target` is the referenced compiler type. Type references are compilation metadata and cannot be represented as JSON values.

```typespec
model Item { id: string; }
model Registration { name: string; type: TypeRef; }
const entry: Registration = #{ name: "item", type: typeref(Item) };
```
