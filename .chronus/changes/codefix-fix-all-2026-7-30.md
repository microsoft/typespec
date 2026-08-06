---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Add `Fix all: X` code action for codefixes that can be applied to multiple instances in a file at once. When a codefix applies to more than one diagnostic of the same kind in a file, a `Fix all: <fix label>` quick fix action is now suggested alongside the individual fix.
