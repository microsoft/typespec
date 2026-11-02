---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add experimental `typeref(Type)` for referencing types from metadata values. JavaScript implementations receive a `TypeRefValue` whose `target` is the referenced compiler type. Libraries can validate references through `valueKind === "TypeRefValue"`. Type references are compilation metadata and cannot be represented as JSON values.

```typespec
model Item { id: string; }
const entry = #{ name: "item", type: typeref(Item) };
```
