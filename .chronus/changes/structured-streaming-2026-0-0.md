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

For SSE streams, the most recently received event `id` and `retry` value (if provided by the server) are exposed via `stream.last_event_id` / `stream.retry`, event payloads may be plain text as well as JSON, and the stream automatically reconnects after an unexpected disconnect using a default three-second delay (or the server-provided `retry` interval) while sending `Last-Event-ID`.
