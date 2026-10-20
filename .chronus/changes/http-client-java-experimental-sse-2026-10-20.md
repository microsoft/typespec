---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add experimental Azure-flavor generation for named JSON server-sent event streams behind `dev-options.enable-sse`.

```tsp
@events
union Events {
  started: StartedEvent,

  @terminalEvent
  completed: CompletedEvent,
}

op stream(): SSEStream<Events>;
```
