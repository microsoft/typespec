---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Reuse ClientCore's known HttpHeaderName constants case-insensitively before generating shared header fields. Preserve custom header spelling, handle imported and shadowed type names, and omit package constants classes that would otherwise contain only duplicate built-in headers.
