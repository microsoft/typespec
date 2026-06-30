---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix formatter inserting a blank line and over-indenting a `union` expression used directly as one of multiple template arguments (e.g. `PickProperties<Source, "a" | "b">`)
