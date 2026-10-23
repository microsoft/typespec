---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Server variables that have an `enum` but no default now use the first `enum` value as their `default` instead of an empty string, since OpenAPI 3.1 and later require the default to be one of the `enum` values. A server variable typed as the service's versions enum uses the version of each emitted document instead. A new `missing-server-variable-default` warning is reported when that first value is used for a variable with more than one possible value.
