---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Allow `model`, `enum`, `union`, and `scalar` declarations to be used as expressions. A declaration used in expression position is anonymous (its `name` is `""`) and its corresponding type has `expression: true`. It is not registered in the enclosing namespace.

```tsp
alias Foo = enum {
  a,
  b,
};

model Bar {
  status: enum { active, inactive };
  unit: scalar extends string;
  inner: model { x: string };
}
```
