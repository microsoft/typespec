---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Reduce duplicate Resource Manager implementations by forwarding matching overloads and inheriting interface documentation. Generate only used `ResourceManagerUtils` helpers and share resource ID validation, without changing public APIs or asynchronous context propagation.
