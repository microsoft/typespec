---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support `@access(Access.internal)` for ARM operations, models, and enums. Hide internal operations from public client and fluent APIs while retaining implementation methods, and generate internal-only types in `implementation.models`.
