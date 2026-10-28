---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add the `includeContinuationTokenParameter` client option on request continuation-token parameters for Azure V1 paging methods. These parameters are hidden by default; set the option to `true` to preserve existing cursor-bearing signatures:

```tsp
@@clientOption(MyService.list::parameters.after, "includeContinuationTokenParameter", true, "java");
```

Automatic paging, explicit page resumption, and protocol REST parameter documentation remain unchanged.
