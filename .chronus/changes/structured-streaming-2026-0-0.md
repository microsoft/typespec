---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Generate structured streaming client methods: operations whose HTTP response is a JSONL (`application/jsonl`) or SSE (`text/event-stream`) stream now return `Stream[T]` / `AsyncStream[T]`, yielding deserialized model instances instead of raw bytes.

The `Stream` / `AsyncStream` runtime (plus the JSONL / SSE decoders) is vendored at `_utils/streaming_base.py` and depends only on the released core runtime for the flavor — `azure.core.rest` for the Azure flavor and `corehttp.rest` for the unbranded flavor. These types are an internal implementation detail and are not part of the package's public API.

```python
stream = client.receive()
for thing in stream:
    ...
```
