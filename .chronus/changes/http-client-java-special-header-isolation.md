---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Keep `skip-special-headers` exclusions local to each code-model build so removing the option restores header parameters on subsequent compilations.
