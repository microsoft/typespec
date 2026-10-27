---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support generating APIs for server-sent events (SSE).

```tsp
@events
union Events {
  message: string,

  @terminalEvent
  completed: string,
}

op stream(): SSEStream<Events>;
```
