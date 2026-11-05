---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Omit unused multipart helper methods from ClientCore and Azure Core v2 libraries without requiring annotation processing. Track fluent and typed instance calls, bound method references, and constructor/initializer dependencies while preserving Azure Core v1 generation and inherited polling contracts.
