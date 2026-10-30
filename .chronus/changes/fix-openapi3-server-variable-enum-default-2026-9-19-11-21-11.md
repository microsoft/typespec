---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Report a new `missing-server-variable-default` warning when a server variable that has an `enum` has no default and the document is emitted for OpenAPI 3.1.0 or later, since those versions require the default to be one of the `enum` values. The emitted `default` stays an empty string.
