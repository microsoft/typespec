---
changeKind: fix
packages:
  - "@typespec/http-specs"
---

Use a unique `ProtocolInfo` model name in the SSE protocol scenarios to avoid model-name collisions in generated clients.
