---
changeKind: feature
packages:
  - "@typespec/http-client-java"
---

Support experimental unnamed and mixed JSON SSE streams and typed string, number, and boolean literal events with inclusive terminal delivery.

```tsp
@events
union ResponseEvents {
  ResponsePayload,

  @Events.contentType("text/plain")
  @terminalEvent
  "[DONE]",
}

op receive(): SSEStream<ResponseEvents>;
```

A sole unnamed JSON payload returns `Flux<T>` or `CloseableIterableStream<T>`.
Adding named or literal alternatives changes the element type to typed event
wrappers. Literal markers are delivered before inclusive termination.