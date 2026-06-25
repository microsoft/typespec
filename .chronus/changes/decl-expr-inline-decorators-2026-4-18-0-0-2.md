---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Allow decorators to be applied inline to `model`, `enum`, `union`, and `scalar` declarations used in expression position.

```tsp
model Foo {
  status: @doc("the current status") enum { active, inactive };
  inner: @doc("nested model") model Inner { x: string };
}
```
