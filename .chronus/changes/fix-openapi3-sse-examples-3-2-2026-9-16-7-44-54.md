---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Emit `@opExample` response examples next to `itemSchema` for SSE streams in OpenAPI 3.2.0. They were silently dropped.
