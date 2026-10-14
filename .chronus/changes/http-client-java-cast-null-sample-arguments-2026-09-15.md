---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Cast null arguments to their declared Java types in generated samples and tests so overloaded API calls are unambiguous.