---
changeKind: fix
packages:
  - "@typespec/http-server-csharp"
---

Do not generate C# model classes for authentication scheme models (e.g. models referenced by `@useAuth`), aligning with the OpenAPI3 emitter which treats them as security metadata. Also fix a property typed as an enum member (e.g. `kind: Color.red`) rendering as an unresolved symbol; it now uses the parent enum type.
