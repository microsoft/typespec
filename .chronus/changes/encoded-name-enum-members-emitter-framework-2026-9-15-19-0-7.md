---
changeKind: fix
packages:
  - "@typespec/emitter-framework"
---

Enum members use their `application/json` `@encodedName` as their value in TypeScript enum declarations, union expressions and value expressions, and in Python atoms, including members with an explicit value, matching the discriminator values returned by `$.model.getDiscriminatedUnion`. Rendering an enum value with the TypeScript `ValueExpression` or Python `Atom` component requires a `TspContext`.
