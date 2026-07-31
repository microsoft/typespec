---
changeKind: fix
packages:
  - "@typespec/spec-api"
---

XML declarations no longer affect semantic body equality in `validateXmlBodyEquals`; both actual and expected XML declarations are ignored during comparison.
