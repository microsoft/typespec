---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Avoid unused serializer fields, format-selection branches, and URI builders in generated clientcore and Azure Core vNext HTTP implementations. Initialize serializers used only for error decoding on the error path.