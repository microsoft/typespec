---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Preserve the ytes type for raw bytes encoded as ytes with a wire type, preventing regression to string and preserving binary streaming.