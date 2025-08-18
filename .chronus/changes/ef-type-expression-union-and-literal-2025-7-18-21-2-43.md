---
changeKind: feature
packages:
  - "@typespec/emitter-framework"
---

Support literal types and nullable union in TypeExpression of csharp
- Properties with "void" type will be ignored when generating csharp class
- Literal type will be mapped to string, int, double, bool in general
- Union contains 'null' or 'void' will be unwrapped to '{other non-nullable union variances}?'
