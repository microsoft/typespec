---
changeKind: breaking
packages:
  - "@typespec/compiler"
---

Config parameters and emitters options cannot contains `.`. This conflict with newly added support for nested options.
