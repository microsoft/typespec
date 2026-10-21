---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Preserve raw byte streaming for XML responses using the legacy bytes encoding instead of deserializing them as XML string scalars.