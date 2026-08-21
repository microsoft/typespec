---
changeKind: feature
packages:
  - "@typespec/http-specs"
---

Add SSE protocol coverage for event IDs, retry fields, and reconnection

```tsp
op reconnect(): SSEStream<ProtocolEvents>;
```
