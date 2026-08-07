---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Generate structured streaming client methods for the **Azure flavor**: operations whose HTTP response is a JSONL (`application/jsonl`) or SSE (`text/event-stream`) stream now return `Stream[T]` / `AsyncStream[T]`, yielding deserialized model instances instead of raw bytes.

`Stream` and `AsyncStream` are available from the generated package's base namespace. Their runtime (plus the JSONL / SSE decoders) is vendored at `_utils/streaming_base.py`, so it depends only on the released `azure.core.rest`.

```python
from your_sdk import Stream

stream: Stream[Thing] = client.receive()
for thing in stream:
    ...
```
