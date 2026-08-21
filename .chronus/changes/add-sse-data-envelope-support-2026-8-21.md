---
changeKind: feature
packages:
  - "@typespec/sse"
---

Support `@data` payloads in SSE event envelopes.

```tsp
@events
union MixedEvents {
  withEnvelope: {
    metadata: Record<string>,
    @data contents: string,
  },
}
```
