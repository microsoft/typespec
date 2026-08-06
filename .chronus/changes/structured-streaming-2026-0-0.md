---
changeKind: feature
packages:
  - "@typespec/http-client-python"
---

Generate structured streaming client methods for the **Azure flavor**: operations whose HTTP response is a JSONL (`application/jsonl`) or SSE (`text/event-stream`) stream now return `Stream[T]` / `AsyncStream[T]`, yielding deserialized model instances instead of raw bytes. This is driven entirely by the TCGC response stream metadata (the response stream type) — there is no opt-in emitter option. The unbranded flavor keeps the existing raw byte-iterator behavior (`Iterator[bytes]` / `AsyncIterator[bytes]`).

Note: for the Azure flavor this changes the return type of JSONL/SSE streaming operations from a raw byte iterator to `Stream[T]` / `AsyncStream[T]`.

The `Stream` / `AsyncStream` runtime (plus the JSONL / SSE decoders) is vendored into the generated package at `_utils/streaming_base.py` (like `_utils/model_base.py`), so it depends only on the released `azure.core.rest` — not on an unreleased `azure.core.streaming`.

```python
# For an operation returning JsonlStream<Thing> (Azure flavor):
stream = client.receive()          # -> Stream[Thing]
for thing in stream:               # deserialized model instances
    ...
```

Known limitations / follow-ups:

- SSE union item types deserialize to parsed JSON (e.g. `dict`) rather than model instances — same root cause as paging item deserialization; the shared `_deserialize` needs a `module` argument to resolve forward-reference union member names.
- Heterogeneous SSE **terminal-event** handling is supported: the terminal marker (e.g. `"[DONE]"`) is detected structurally as a string-literal member of the item union and passed to the vendored `Stream` / `AsyncStream` as `terminal_event`, so iteration stops before parsing it. Per-event **model dispatch** (routing each `@events` event to its distinct payload model) is still blocked on TCGC `sseMetadata` (typespec-client-generator-core #4882), absent from the resolved TCGC version; until then heterogeneous events are yielded as parsed JSON.
- In-repo mock_api coverage: JSONL homogeneous (sync + async) is active against the default Azure `streaming.jsonl` package and yields deserialized model instances; the unbranded byte-iterator behavior is covered separately. SSE homogeneous (`unnamed/receive`) and heterogeneous (`named/receive`, terminating at `[DONE]`) mock_api tests are active (sync + async) against the `streaming/sse` scenario in `@typespec/http-specs`, asserting the yielded event payloads (as `dict`s per the union-deserialization limitation).
