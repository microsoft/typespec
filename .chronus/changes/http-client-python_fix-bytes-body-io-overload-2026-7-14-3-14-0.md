---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Add an `IO[bytes]` overload alongside `bytes` for binary `bytes` bodies, keeping backward compatibility for services migrating from swagger whose binary bodies were typed as `IO`.
