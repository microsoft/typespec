---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Allow augment decorators (`@@`) to target `model`, `enum`, `union`, and `scalar` declarations used in expression position (reached via a navigation reference such as `::type`).

```tsp
model Foo {
  status: enum { active, inactive };
}

@@doc(Foo.status::type, "the current status");
```
