---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Prevent duplicate named union aliases, and preserve parameter types in generated body overloads when a flattened parameter is filtered out.
