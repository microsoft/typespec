---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Fix tag order not being preserved when `@tagMetadata` decorator is used. Tags are now emitted in TypeSpec declaration order.
