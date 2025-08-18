---
changeKind: feature
packages:
  - "@typespec/emitter-framework"
---

Support literal types and nullable union in TypeExpression of csharp
- Literal type will be mapped to string, int, double, bool
- Union contains 'null' or 'void' will be treated as nullable and mapped to '{other non-nullable union variances}?'
