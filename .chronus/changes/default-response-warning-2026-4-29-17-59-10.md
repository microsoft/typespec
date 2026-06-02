---
changeKind: feature
packages:
  - "@typespec/openapi"
---

Added a warning diagnostic when `@defaultResponse` is used on a model that already has a `@statusCode` property or is marked with `@error`.
