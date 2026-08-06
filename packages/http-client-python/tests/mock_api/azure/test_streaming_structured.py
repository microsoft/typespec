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

Note on SSE item deserialization: SSE item types are described by TCGC ``sseMetadata``
(SdkSseEventMetadata[]), so the generated callback routes each ``event:`` name to its
concrete payload model and yields model instances (homogeneous via the single event
payload, heterogeneous via per-event dispatch). Terminal-event handling (e.g. a trailing
``data: [DONE]``) is wired into the vendored runtime so the stream stops before the
callback is invoked for it.

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


# For the Azure flavor the SSE ``streaming.sse`` package is generated with structured
# ``receive()`` methods: ``unnamed.receive()`` returns ``Stream[Info]`` and
# ``named.receive()`` returns ``Stream["_unions.ResponseEvents"]`` dispatched per event.
# Guarded so collection doesn't error for the unbranded flavor (byte-iterator ``receive()``).
try:  # pragma: no cover - guarded so collection doesn't error when absent
    from streaming.sse import SseClient  # type: ignore
    from streaming.sse.aio import SseClient as AsyncSseClient  # type: ignore
    from streaming.sse.unnamed.models import Info as SseInfo  # type: ignore
    from streaming.sse.named.models import ResponseCreated, ResponseDelta  # type: ignore

    _HAS_STRUCTURED_SSE = True
except ImportError:  # pragma: no cover
    SseClient = None  # type: ignore
    AsyncSseClient = None  # type: ignore
    SseInfo = None  # type: ignore
    ResponseCreated = None  # type: ignore
    ResponseDelta = None  # type: ignore
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
    """SSE homogeneous: unnamed.receive() returns Stream[Info] of deserialized models.

    The unnamed SSE scenario emits three ``message`` events with payload
    ``{"desc": ...}``. ``sseMetadata`` maps the single (unnamed) event to the ``Info``
    payload model, so the callback yields ``Info`` instances. The stream terminates
    naturally after the final event.
    """
    with SseClient(endpoint="http://localhost:3000") as client:
        items = list(client.unnamed.receive())
    assert all(isinstance(i, SseInfo) for i in items)
    assert [i.desc for i in items] == _EXPECTED


@pytest.mark.skipif(not _HAS_STRUCTURED_SSE, reason="streaming.sse is not structured (unbranded flavor)")
@pytest.mark.asyncio
async def test_sse_receive_homogeneous_structured_async():
    """Async SSE homogeneous: unnamed.receive() returns AsyncStream[Info]."""
    async with AsyncSseClient(endpoint="http://localhost:3000") as client:
        stream = await client.unnamed.receive()
        items = [item async for item in stream]
    assert all(isinstance(i, SseInfo) for i in items)
    assert [i.desc for i in items] == _EXPECTED


@pytest.mark.skipif(not _HAS_STRUCTURED_SSE, reason="streaming.sse is not structured (unbranded flavor)")
def test_sse_receive_heterogeneous_structured_sync():
    """SSE heterogeneous: named.receive() dispatches each event to its payload model.

    The named SSE scenario emits ``responseCreated`` (``{"id": ...}``) then two
    ``responseDelta`` (``{"delta": ...}``) events, followed by a terminal
    ``data: [DONE]`` event. ``sseMetadata`` routes ``responseCreated`` -> ``ResponseCreated``
    and ``responseDelta`` -> ``ResponseDelta``, so the callback yields distinct model
    instances. ``[DONE]`` is wired as ``terminal_event``: the runtime stops there (without
    trying to JSON-parse ``[DONE]``).
    """
    with SseClient(endpoint="http://localhost:3000") as client:
        items = list(client.named.receive())
    assert [type(i) for i in items] == [ResponseCreated, ResponseDelta, ResponseDelta]
    assert items[0].id == "resp_1"
    assert [i.delta for i in items[1:]] == ["Hello", " world"]


@pytest.mark.skipif(not _HAS_STRUCTURED_SSE, reason="streaming.sse is not structured (unbranded flavor)")
@pytest.mark.asyncio
async def test_sse_receive_heterogeneous_structured_async():
    """Async SSE heterogeneous: named.receive() dispatches per event, terminating at [DONE]."""
    async with AsyncSseClient(endpoint="http://localhost:3000") as client:
        stream = await client.named.receive()
        items = [item async for item in stream]
    assert [type(i) for i in items] == [ResponseCreated, ResponseDelta, ResponseDelta]
    assert items[0].id == "resp_1"
    assert [i.delta for i in items[1:]] == ["Hello", " world"]
