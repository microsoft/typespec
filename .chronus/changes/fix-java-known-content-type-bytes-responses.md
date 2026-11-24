---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Preserve the legacy String mapping for raw bytes responses with only recognized content types while retaining binary handling for mixed unknown content types.
