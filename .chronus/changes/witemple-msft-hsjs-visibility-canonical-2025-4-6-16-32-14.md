---
changeKind: feature
packages:
  - "@typespec/http-server-js"
---

Implemented canonical visibility transforms. When HTTP operations imply particular implicit visibility transforms, this change enables `@typespec/http-server-js` to perform those transforms, removing invisible properties in contexts where they cannot be used.
