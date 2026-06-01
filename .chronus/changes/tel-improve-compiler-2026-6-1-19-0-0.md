---
changeKind: fix
packages:
  - "@typespec/compiler"
---

Wrapped LSP server handlers with `wrapUnhandledError` to preserve server-side stack traces in error messages forwarded to the client. Previously, the JSON-RPC layer discarded the original stack trace, making unhandled errors in telemetry opaque.
