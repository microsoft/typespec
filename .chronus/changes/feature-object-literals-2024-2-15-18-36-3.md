---
# Change versionKind to one of: internal, fix, dependencies, feature, deprecation, breaking
changeKind: fix
packages:
  - "@typespec/compiler"
---

New Language Feature: Object and Tuple Literals.

```tsp
@dummy(#{
  name: "John",
  age: 48,
  address: #{ city: "London" }
  aliases: #["Bob", "Frank"]
})
```
