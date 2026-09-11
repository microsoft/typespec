---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Allow decorators to be applied to `model`, `enum`, `union`, and `scalar` declarations used in expression position. Inline decorators can be applied directly, and augment decorators (`@@`) can target them through a navigation reference (such as `::type`).

```tsp
model Foo {
  status: @doc("the current status") enum { active, inactive };
  inner: @doc("nested model") model Inner { x: string };
}

@@doc(Foo.status::type, "the current status");
```
