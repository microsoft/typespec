---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Fix multi-client packages generating a separate `ServiceVersion` enum per client when all clients share the same api-versions. The api-version comparison now compares version strings instead of `ApiVersion` object references, restoring a single shared `ServiceVersion` for such packages.
