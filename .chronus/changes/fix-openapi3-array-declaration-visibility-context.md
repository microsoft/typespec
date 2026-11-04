---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Reduce the visibility context of array declarations so that named array models are not incorrectly emitted with an `Item` suffix.
