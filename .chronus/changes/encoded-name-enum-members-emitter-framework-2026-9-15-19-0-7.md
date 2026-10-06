---
changeKind: fix
packages:
  - "@typespec/emitter-framework"
---

Enum members use their `application/json` `@encodedName` as their value in TypeScript enum declarations, union expressions and value expressions, and in Python enum declarations and atoms, including members with an explicit value, matching the discriminator values returned by `$.model.getDiscriminatedUnion`. A Python enum declaration gives every member its value, using the member name when it has neither a value nor an encoded name, as TypeScript does, and picks `StrEnum` or `IntEnum` from those values. Members are no longer declared with `auto()`, which gave a member without a value a number its serialized form never used, and failed at import beside a string value. Rendering the TypeScript or Python `EnumMember`, the TypeScript `ValueExpression` or the Python `Atom` component for an enum value requires a `TspContext`.
