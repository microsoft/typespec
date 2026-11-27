---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Honor `replaceResponseWithVoid` for basic client methods, returning `None` while preserving the service response on the wire.
