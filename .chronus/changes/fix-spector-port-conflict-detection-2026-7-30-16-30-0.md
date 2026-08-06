---
changeKind: fix
packages:
  - "@typespec/spector"
---

Fail with a clear error when the mock server port is already taken instead of silently running the scenarios against an unrelated server. `server start` now waits for the server to actually be ready, `server stop` no longer signals a process that is not a mock server, and `knock` fails if the server never becomes reachable instead of reporting it as ready.
