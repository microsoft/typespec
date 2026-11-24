---
changeKind: fix
packages:
  - "@typespec/http-client-js"
---

Prevent reporting spurious `unknown-encoding` warnings for raw `bytes` body with `none` encoding (e.g. binary content types such as `application/octet-stream`).
