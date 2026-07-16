---
changeKind: fix
packages:
  - "@typespec/spector"
---

Restrict the mock server to the loopback interface (`127.0.0.1`) by default and only accept the unauthenticated `/.admin/stop` signal from the local host. This prevents a network-reachable client from stopping the server. Use `--host 0.0.0.0` to explicitly listen on all interfaces when needed.
