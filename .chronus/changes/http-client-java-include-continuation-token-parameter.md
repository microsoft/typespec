---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add the operation-level `includeContinuationTokenParameter` client option for Azure V1 paging methods. Continuation-token parameters are hidden by default; set the option to `true` to preserve existing cursor-bearing signatures:

```tsp
@@clientOption(MyService.list, "includeContinuationTokenParameter", true, "java");
```

Automatic paging, explicit page resumption, and protocol REST parameter documentation remain unchanged.
