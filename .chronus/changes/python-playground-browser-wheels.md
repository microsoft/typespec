---
changeKind: fix
packages:
  - "@typespec/http-client-python"
---

Fix Python playground generation when package downloads are blocked on corporate networks. Publish browser-compatible dependency wheels with the emitter instead of querying PyPI or CFS at runtime. Prepare these assets only for playground builds.
