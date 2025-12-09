---
changeKind: fix
packages:
  - "@typespec/openapi3"
---

Import OpenAPI schemas with anyOf/oneOf containing unixtime format correctly emits @encode(DateTimeKnownEncoding.unixTimestamp, integer) decorator for nullable utcDateTime properties
