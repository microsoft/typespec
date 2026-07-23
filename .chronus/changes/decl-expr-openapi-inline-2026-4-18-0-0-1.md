---
changeKind: feature
packages:
  - "@typespec/openapi"
  - "@typespec/openapi3"
---

Support `model`, `enum`, `union`, and `scalar` declarations used in expression position. Anonymous declaration expressions are inlined, while named ones are hoisted into a referenced component.

```tsp
model Foo {
  status: enum { active, inactive }; // inlined
  unit: scalar extends string; // inlined
  inner: model Inner { x: string }; // hoisted as component `Inner`
}
```
