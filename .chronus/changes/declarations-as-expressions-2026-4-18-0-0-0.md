---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Allow `model`, `enum`, `union`, and `scalar` declarations to be used as expressions. A declaration used in expression position has its corresponding type marked with `expression: true` and is not registered in the enclosing namespace. It may be named or anonymous (in which case its `name` is `""`).

```tsp
alias Foo = enum {
  a,
  b,
};

model Bar {
  status: enum { active, inactive };
  unit: scalar extends string;
  inner: model Inner { x: string };
}
```
