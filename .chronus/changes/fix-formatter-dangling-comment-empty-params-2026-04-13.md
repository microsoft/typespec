---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Fix formatter crash when an operation's parameter list contains only a block comment (e.g. `op find(/* conditions */): unknown;`). Dangling comments in empty parameter lists are now preserved instead of being dropped.
