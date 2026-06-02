---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Fixed an issue with handling of `bytes` response bodies with content-types other than "application/json" that would cause http-server-js to emit an invalid attempt to call `Uint8Array.toJsonObject`.