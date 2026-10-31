---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add experimental support for named JSON server-sent events (SSE) in Azure-v1 data-plane convenience APIs. Other SSE shapes retain their existing binary response handling.

```tsp
@events
union Events {
  message: string,

  @terminalEvent
  completed: string,
}

op stream(): SSEStream<Events>;
```
