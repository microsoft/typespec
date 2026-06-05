---
changeKind: feature
packages:
  - "@typespec/http-server-js"
---

Added support for `Http.File` response bodies. File bodies are treated as _raw_ bytes, and the `filename` is represented in the `Content-Disposition` header.