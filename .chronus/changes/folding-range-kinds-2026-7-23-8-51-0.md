---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Language server folding ranges now report a `kind`: comments fold as `comment` and consecutive `import` statements fold together as an `imports` region. This enables editor commands such as "Fold All Block Comments" and "Fold All Imports" to work with TypeSpec files.
