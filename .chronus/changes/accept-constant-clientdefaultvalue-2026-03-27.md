---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Emitter support for constant optional Accept header with `@clientDefaultValue`. When an Accept header is optional with a constant type and has `@Legacy.clientDefaultValue`, the emitter now treats it as a required constant, ensuring the value is always sent and hidden from the public API.
