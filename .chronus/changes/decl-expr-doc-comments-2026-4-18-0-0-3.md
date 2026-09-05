---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Allow a doc comment to be applied inline to a `model`, `enum`, `union`, or `scalar` declaration expression, just like an inline `@doc` decorator.

```tsp
model Foo {
  status: /** the current status */ enum { active, inactive };
}
```
