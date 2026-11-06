---
changeKind: feature
packages:
  - "@typespec/compiler"
  - "@typespec/tspd"
  - "@typespec/graphql"
  - "@typespec/json-schema"
  - "@typespec/openapi3"
---

Add `typeref(Type)` for referencing types from metadata values. Enable the `typeref` compiler feature in the calling project or library's `tspconfig.yaml`. Its result has type `TypeRef<T>`, where `T` is the referenced type. Use `TypeRef` to accept any type reference, or `TypeRef<T>` to constrain its target. JavaScript implementations and generated signatures use `TypeRefValue` from `@typespec/compiler`, whose `target` is the referenced compiler type. Type references are compilation metadata and cannot be represented as JSON values.

```typespec
model Item { id: string; }
model Registration { name: string; type: TypeRef; }
const entry: Registration = #{ name: "item", type: typeref(Item) };
```
