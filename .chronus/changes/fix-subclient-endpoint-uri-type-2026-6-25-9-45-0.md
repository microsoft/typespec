---
changeKind: fix
packages:
  - "@typespec/http-client-csharp"
---

Fix sub-client constructor to accept the endpoint as a `Uri` when the root client takes the endpoint as a hostname `string`. Previously the sub-client's `_endpoint` field was typed `Uri` while its constructor parameter (and the value passed by the parent) was a `string`, producing generated code that did not compile (CS0029/CS1503).
