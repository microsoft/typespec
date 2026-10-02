---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Improve formatting of declaration expressions (`model`, `enum`, `union`, and `scalar` used in expression position) that carry doc comments and/or decorators. When the inline form would exceed the print width, the doc comments and decorators are now each placed on their own line and the whole block is indented one level instead of overflowing.

```tsp
model Foo {
  status:
    @summary("a fairly long summary text here")
    @example("some-default-example-value")
    enum {
      active,
      inactive,
    };
}
```
