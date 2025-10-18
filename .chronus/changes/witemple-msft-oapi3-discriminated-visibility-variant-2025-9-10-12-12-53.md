---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Addressed an issue where `@discriminated` union envelope schemas could sometimes have duplicate names in the context of visibility transforms.