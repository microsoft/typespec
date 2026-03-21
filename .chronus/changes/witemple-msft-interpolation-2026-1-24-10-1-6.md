---
changeKind: feature
packages:
  - "@typespec/compiler"
---

Added the ability to interpolate identifiers in most positions (model, property, enum, union, scalar, operation names, etc.). To compute an identifier, use backticks as if creating a templated string type (e.g. `const v = "Model"; model \`My${v}` { ... }`).