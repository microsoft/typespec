---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Honor void and raw-byte response replacements in generated Java clients, preserving types used by typed response headers. Fix raw-byte conversion for text responses.
