---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

[importer] Fix `anyOf` with `$ref` and inline object being incorrectly imported as a model instead of a union.
