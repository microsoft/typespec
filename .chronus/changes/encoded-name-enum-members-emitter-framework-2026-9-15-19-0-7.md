---
changeKind: breaking
packages:
  - "@typespec/emitter-framework"
---

Enum members use their `application/json` `@encodedName` as their value in the TypeScript and Python components. Rendering `EnumMember`, `ValueExpression` or `Atom` for an enum value now requires a `TspContext`.
