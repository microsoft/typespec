---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Added experimental support for `internal` modifiers on type declarations. Any type _except `namespace`_ can be declared `internal`. An `internal` symbol can only be accessed from within the same package where it was declared.
