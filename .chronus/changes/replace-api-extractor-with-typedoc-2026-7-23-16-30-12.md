---
changeKind: internal
packages:
  - "@typespec/compiler"
  - "@typespec/http"
  - "@typespec/openapi"
  - "@typespec/openapi3"
  - "@typespec/json-schema"
  - "@typespec/xml"
  - "@typespec/asset-emitter"
  - "@typespec/graphql"
---

Replace the `@microsoft/api-extractor` public API documentation enforcement with a TypeDoc-based `check-api-docs` check that supports modern ESM export maps and validates every stable public entry point.
