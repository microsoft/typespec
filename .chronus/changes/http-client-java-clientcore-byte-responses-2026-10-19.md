---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Fix annotation-processor-free ClientCore base64 and base64url byte responses, including nested collections and null bodies, while preserving raw binary response handling.

Reduce generated ClientCore and Azure Core v2 code with shared protocol helpers, reusable immutable metadata, static serializer references, and compact status-code checks and error mappings. Remove unreachable annotation-processor proxy branches while preserving Azure Core v1 behavior and public service interfaces.
