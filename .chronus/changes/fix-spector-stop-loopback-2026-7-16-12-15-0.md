---
changeKind: fix
packages:
  - "@typespec/spector"
---

Bind the mock server to the loopback interface (`127.0.0.1`) so the unauthenticated `/.admin/stop` endpoint can no longer be reached by other hosts on the network. The server is only reachable from the local host.
