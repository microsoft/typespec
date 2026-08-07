---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Generate structured streaming client methods for the **Azure flavor**: operations whose HTTP response is a JSONL (`application/jsonl`) or SSE (`text/event-stream`) stream now return `Stream[T]` / `AsyncStream[T]`, yielding deserialized model instances instead of raw bytes.


The `Stream` / `AsyncStream` runtime (plus the JSONL / SSE decoders) is vendored into the generated package at `_utils/streaming_base.py` (like `_utils/model_base.py`), so it depends only on the released `azure.core.rest` — not on an unreleased `azure.core.streaming`.

```python
# For an operation returning JsonlStream<Thing> (Azure flavor):
stream = client.receive()          # -> Stream[Thing]
for thing in stream:               # deserialized model instances
    ...
```
