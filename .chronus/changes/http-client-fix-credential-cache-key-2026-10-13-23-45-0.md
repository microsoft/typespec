---
changeKind: fix
packages:
  - "@typespec/http-client"
---

Fix the synthetic `credential` parameter being reused across different `http` auth schemes (for example `BearerAuth` and `BasicAuth`) because it was cached by scheme type only.
