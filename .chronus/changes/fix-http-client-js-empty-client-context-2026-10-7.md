---
changeKind: fix
packages:
  - "@typespec/http-client-js"
---

Do not emit an unused private `#context` field for clients without operations. This fixes `TS6133` errors for consumers compiling the generated client with `noUnusedLocals`.
