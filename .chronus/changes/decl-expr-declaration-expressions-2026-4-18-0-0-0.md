---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Allow `model`, `enum`, `union`, and `scalar` declarations to be used as expressions. A declaration used in expression position has its corresponding type marked with `expression: true` and is not registered in the enclosing namespace. It may be named or anonymous (in which case it has no name).

This is an experimental feature that must be opted into by adding `declaration-expressions` to the `features` list in `tspconfig.yaml`; using a declaration expression without it reports a `declaration-expression-disabled` error.

They can be used anywhere an expression is expected, including aliases, model properties, decorator arguments, template arguments, function/call arguments, and tuples.

`model`, `scalar`, and `union` declaration expressions support the same `extends` clause as their statement form (union `extends` additionally requires the `union-extends` feature).

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

@Versioning.versioned(enum Versions { v1, v2 })
namespace MyService;
```
