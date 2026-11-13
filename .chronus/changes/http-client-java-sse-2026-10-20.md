---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add support for named JSON server-sent events (SSE) in Azure-v1 data-plane convenience APIs.

```tsp
@events
union Events {
  message: string,

  @terminalEvent
  completed: string,
}

op stream(): SSEStream<Events>;
```
