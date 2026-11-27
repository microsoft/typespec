---
changeKind: fix
packages:
  - "@typespec/graphql"
---

Fix `decorator-wrong-target` errors for constraint decorators (`@pattern`, `@minLength`, `@maxLength`, `@format`, `@minValue`, `@maxValue`, ...) on custom scalars. These decorators can now be used on scalars emitted to GraphQL.
