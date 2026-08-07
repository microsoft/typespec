# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Mock API tests for structured streaming (Azure flavor).

These tests exercise operations that return `Stream[T]` / `AsyncStream[T]`. The
streaming runtime (Stream / AsyncStream + JSONL / SSE decoders) is **vendored**
into the generated package at `_utils/streaming_base.py`, so it only depends on
the released `azure.core.rest` — NOT on the unreleased `azure.core.streaming`
(azure-core PR #48077).

Structured streaming is driven by the TCGC response stream metadata and applies
to the **Azure flavor only** (the vendored runtime depends on `azure.core.rest`).
For the Azure flavor, a JSONL (`application/jsonl`) / SSE (`text/event-stream`)
streaming response generates a `receive()` returning `Stream[T]` / `AsyncStream[T]`,
so the JSONL homogeneous tests below run against the real spector mock route
(`/streaming/jsonl/basic/receive`) and the SSE homogeneous tests run against
(`/streaming/sse/unnamed/receive`). For the unbranded flavor, streaming responses
keep the raw byte-iterator behavior (see
mock_api/unbranded/test_streaming_jsonl_unbranded.py).

Note on SSE item deserialization: SSE item types are modelled as `@events` unions,
which the generated callback deserializes via `_deserialize("<forward-ref>", json)`.
The shared `_deserialize` cannot resolve a forward-ref *string* union member into a
model instance (same root cause as paging item deserialization needing a `module`
argument), so homogeneous SSE items are yielded as parsed JSON (``dict``) rather than
model instances. The tests below assert on the ``dict`` payloads accordingly.

Still skipped (follow-ups):

* SSE heterogeneous — blocked on TCGC `sseMetadata` (#4882) for per-event
  dispatch + terminal-event handling, plus the union-item `_deserialize`
  limitation (parsed JSON rather than model instances).

Imports are guarded so collection never errors when the package is absent
(e.g. before `regenerate` runs, or for the unbranded flavor).
"""
import pytest

# For the Azure flavor the default ``streaming.jsonl`` package is generated with a
# structured ``receive()`` returning ``Stream[Info]`` (grouped namespace layout, so
# ``Info`` lives at ``streaming.jsonl.basic.models``). Guarded so collection doesn't
# error for the unbranded flavor (byte-iterator ``receive()``, no ``Info`` model).
try:  # pragma: no cover - guarded so collection doesn't error when absent
    from streaming.jsonl import JsonlClient  # type: ignore
    from streaming.jsonl.aio import JsonlClient as AsyncJsonlClient  # type: ignore
    from streaming.jsonl.basic.models import Info  # type: ignore

    _HAS_STRUCTURED_JSONL = True
except ImportError:  # pragma: no cover
    JsonlClient = None  # type: ignore
    AsyncJsonlClient = None  # type: ignore
    Info = None  # type: ignore
    _HAS_STRUCTURED_JSONL = False


# For the Azure flavor the SSE ``streaming.sse`` package is generated with a structured
# ``unnamed.receive()`` returning ``Stream["_unions.UnnamedEvents"]``. Guarded so
# collection doesn't error for the unbranded flavor (byte-iterator ``receive()``).
try:  # pragma: no cover - guarded so collection doesn't error when absent
    from streaming.sse import SseClient  # type: ignore
    from streaming.sse.aio import SseClient as AsyncSseClient  # type: ignore

    _HAS_STRUCTURED_SSE = True
except ImportError:  # pragma: no cover
    SseClient = None  # type: ignore
    AsyncSseClient = None  # type: ignore
    _HAS_STRUCTURED_SSE = False


_EXPECTED = ["one", "two", "three"]


@pytest.mark.skipif(not _HAS_STRUCTURED_JSONL, reason="streaming.jsonl is not structured (unbranded flavor)")
def test_jsonl_receive_structured_sync():
    """JSONL homogeneous: receive() returns Stream[Info] of deserialized models."""
    with JsonlClient(endpoint="http://localhost:3000") as client:
        items = list(client.basic.receive())
    assert [i.desc for i in items] == _EXPECTED
    assert all(isinstance(i, Info) for i in items)


@pytest.mark.skipif(not _HAS_STRUCTURED_JSONL, reason="streaming.jsonl is not structured (unbranded flavor)")
@pytest.mark.asyncio
async def test_jsonl_receive_structured_async():
    """JSONL homogeneous: async receive() returns AsyncStream[Info]."""
    async with AsyncJsonlClient(endpoint="http://localhost:3000") as client:
        stream = await client.basic.receive()
        items = [item async for item in stream]
    assert [i.desc for i in items] == _EXPECTED
    assert all(isinstance(i, Info) for i in items)


@pytest.mark.skipif(not _HAS_STRUCTURED_SSE, reason="streaming.sse is not structured (unbranded flavor)")
def test_sse_receive_homogeneous_structured_sync():
    """SSE homogeneous: unnamed.receive() returns Stream over the SSE events.

    The unnamed SSE scenario emits three ``message`` events with payload
    ``{"desc": ...}``. Because the SSE item type is an ``@events`` union, the
    generated callback yields parsed JSON (``dict``) rather than ``Info`` model
    instances (see module docstring / ``_deserialize`` limitation). The stream
    terminates naturally after the final event.
    """
    with SseClient(endpoint="http://localhost:3000") as client:
        items = list(client.unnamed.receive())
    assert [i["desc"] for i in items] == _EXPECTED
    assert all(isinstance(i, dict) for i in items)


@pytest.mark.skipif(not _HAS_STRUCTURED_SSE, reason="streaming.sse is not structured (unbranded flavor)")
@pytest.mark.asyncio
async def test_sse_receive_homogeneous_structured_async():
    """Async SSE homogeneous: unnamed.receive() returns AsyncStream over the events."""
    async with AsyncSseClient(endpoint="http://localhost:3000") as client:
        stream = await client.unnamed.receive()
        items = [item async for item in stream]
    assert [i["desc"] for i in items] == _EXPECTED
    assert all(isinstance(i, dict) for i in items)


@pytest.mark.skipif(not _HAS_STRUCTURED_SSE, reason="streaming.sse is not structured (unbranded flavor)")
def test_sse_receive_heterogeneous_structured_sync():
    """SSE heterogeneous: named.receive() returns Stream over an ``@events`` union.

    The named SSE scenario emits ``responseCreated`` (``{"id": ...}``) then two
    ``responseDelta`` (``{"delta": ...}``) events, followed by a terminal
    ``data: [DONE]`` event. ``[DONE]`` is a string-literal member of the item union,
    so the generator wires it as ``terminal_event`` and the runtime stops there
    (without trying to JSON-parse ``[DONE]``). Per-event payloads are yielded as
    parsed JSON (``dict``) rather than distinct ``ResponseCreated`` / ``ResponseDelta``
    model instances: discriminating them needs TCGC ``sseMetadata`` (#4882) plus a
    ``module`` argument on the shared ``_deserialize`` (same limitation as paging
    item deserialization).
    """
    with SseClient(endpoint="http://localhost:3000") as client:
        items = list(client.named.receive())
    assert all(isinstance(i, dict) for i in items)
    assert items == [{"id": "resp_1"}, {"delta": "Hello"}, {"delta": " world"}]


@pytest.mark.skipif(not _HAS_STRUCTURED_SSE, reason="streaming.sse is not structured (unbranded flavor)")
@pytest.mark.asyncio
async def test_sse_receive_heterogeneous_structured_async():
    """Async SSE heterogeneous: named.receive() returns AsyncStream, terminating at [DONE]."""
    async with AsyncSseClient(endpoint="http://localhost:3000") as client:
        stream = await client.named.receive()
        items = [item async for item in stream]
    assert all(isinstance(i, dict) for i in items)
    assert items == [{"id": "resp_1"}, {"delta": "Hello"}, {"delta": " world"}]
