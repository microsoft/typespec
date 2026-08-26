---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Do not throw on a per-service api-version map; treat it as undefined so a client with a single api-version can still be generated.
