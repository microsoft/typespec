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

For SSE, each `event:` name is routed to its concrete payload model (via TCGC `sseMetadata`), so the stream yields distinct model instances — homogeneous streams via their single event payload and heterogeneous (`@events`) streams via per-event dispatch. A `@terminalEvent` marker (e.g. `"[DONE]"`) is wired into the runtime as `terminal_event`, so iteration stops before the marker is deserialized.

Known limitations / follow-ups:

- SSE events flagged `isEventEnvelope` are not yet specially unwrapped; the payload is deserialized directly. No current spector SSE scenario exercises this.
- Per-event SSE model dispatch consumes TCGC `sseMetadata` (`SdkSseMetadata.events[]`), first available in `@azure-tools/typespec-client-generator-core` `0.71.0-dev.11`, which targets the `@typespec` 1.15-dev / 0.85-dev prerelease line; the package's `devDependencies` pin those prereleases. The generated runtime is unaffected (released `azure.core.rest` only).
- In-repo mock_api coverage: JSONL homogeneous (sync + async) runs against the default Azure `streaming.jsonl` package and yields deserialized model instances; the unbranded byte-iterator behavior is covered separately. SSE homogeneous (`unnamed/receive`, yielding `Info`) and heterogeneous (`named/receive`, yielding `ResponseCreated` / `ResponseDelta` and terminating at `[DONE]`) mock_api tests are active (sync + async) against the `streaming/sse` scenario in `@typespec/http-specs`, asserting the yielded model instances.
