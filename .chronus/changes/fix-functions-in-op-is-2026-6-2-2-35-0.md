---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Allow using function calls in `op is` expressions. Previously, writing `op test is myFunction(args)` would produce a "A value cannot be used as a type" error, requiring an intermediate alias as a workaround.
