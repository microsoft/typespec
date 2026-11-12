---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Omit unset optional multipart boolean and numeric parts instead of serializing them as null text.
