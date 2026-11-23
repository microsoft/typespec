---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Reduce duplicate Resource Manager implementations by forwarding matching overloads and inheriting interface documentation, without changing public APIs or asynchronous context propagation.
