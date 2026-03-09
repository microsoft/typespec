---
changeKind: feature
packages:
  - "@typespec/http"
---

Add warning diagnostic when `bytes` is used as a body type with an XML content type (e.g. `application/xml`). The payload will be treated as raw binary data; use a model type for structured XML serialization.