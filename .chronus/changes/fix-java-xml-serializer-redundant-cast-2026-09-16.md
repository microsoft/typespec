---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Remove a redundant cast from the generated XML serializer so clients compile when redundant-cast warnings are treated as errors.
