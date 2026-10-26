---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Add automatic Azure v1 generation for supported named JSON server-sent event streams, including typed sync and async streaming APIs and recursive scalar, array, and dictionary payload decoding.

Preserve operation visibility and protocol method names, export event packages for Java modules, and escape event type names as Java identifiers.

Prevent incompatible dictionary streams from sharing converters, and support string events named `event`.

```tsp
@events
union Events {
  started: StartedEvent,

  @terminalEvent
  completed: CompletedEvent,
}

op stream(): SSEStream<Events>;
```
