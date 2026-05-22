---
changeKind: fix
packages:
  - "@typespec/openapi"
---

Fix error location for invalid extension key in `@tagMetadata` to point to the invalid property name instead of the decorator argument