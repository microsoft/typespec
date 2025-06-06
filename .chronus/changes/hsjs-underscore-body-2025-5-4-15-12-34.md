---
changeKind: fix
packages:
  - "@typespec/http-server-js"
---

Fixes emitter crash when operation return types included metadata or `@body` properties that only contained underscores