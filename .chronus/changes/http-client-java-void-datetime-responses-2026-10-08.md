---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Fix ClientCore `Response<Void>` handling and typed, null-safe deserialization of date-time response collections, preserving RFC1123 and Unix timestamp encodings.
