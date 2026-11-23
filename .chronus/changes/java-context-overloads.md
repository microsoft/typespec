---
changeKind: fix
packages:
  - "@typespec/http-client-java"
---

Reduce duplicate synchronous Resource Manager paging and long-running operation implementations by forwarding matching overloads to their Context overloads, without changing public APIs or asynchronous context propagation.
