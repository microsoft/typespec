---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix issue where operation example woudld produce an empty object when `@body`/`@bodyRoot` was used 