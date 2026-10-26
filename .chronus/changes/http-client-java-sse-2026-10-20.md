---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add automatic Azure v1 generation for supported named JSON server-sent event streams, including typed sync and async streaming APIs and recursive scalar, array, and dictionary payload decoding.

```tsp
@events
union Events {
  started: StartedEvent,

  @terminalEvent
  completed: CompletedEvent,
}

op stream(): SSEStream<Events>;
```
