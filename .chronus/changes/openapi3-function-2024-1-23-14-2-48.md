---
changeKind: feature
packages:
  - "@typespec/openapi3"
---

Add `getOpenAPI3` function that takes a TypeSpec program and returns the emitted OpenAPI as an object. Useful for other emitters and tools that want to work with emitted OpenAPI directly without writing it to disk.