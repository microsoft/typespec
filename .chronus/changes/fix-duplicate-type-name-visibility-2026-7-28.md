---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix duplicate type name error when a model with a `@visibility(Lifecycle.Create, Lifecycle.Update)` property extends another model.
