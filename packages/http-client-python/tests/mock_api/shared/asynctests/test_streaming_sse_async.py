# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import json

import pytest
import pytest_asyncio

from streaming.sse.aio import SseClient
from streaming.sse._utils.streaming_base import AsyncStream
from streaming.sse.named.models import ResponseCreated, ResponseDelta
from streaming.sse.retrieve.models import FinalResult, PartialResult, RetrievalRequest
from streaming.sse.unnamed.models import Info


@pytest_asyncio.fixture
async def client():
    async with SseClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_unnamed_receive(client: SseClient):
    stream = await client.unnamed.receive()
    assert isinstance(stream, AsyncStream)
    items = [item async for item in stream]
    assert all(isinstance(item, Info) for item in items)
    assert [item.desc for item in items] == ["one", "two", "three"]


@pytest.mark.asyncio
async def test_named_receive(client: SseClient):
    stream = await client.named.receive()
    assert isinstance(stream, AsyncStream)
    items = [item async for item in stream]
    # The terminal "[DONE]" event stops iteration and is not yielded.
    assert len(items) == 3
    assert isinstance(items[0], ResponseCreated) and items[0].id == "resp_1"
    assert isinstance(items[1], ResponseDelta) and items[1].delta == "Hello"
    assert isinstance(items[2], ResponseDelta) and items[2].delta == " world"


@pytest.mark.asyncio
async def test_retrieve_stream(client: SseClient):
    stream = await client.retrieve.stream(RetrievalRequest(query="what is typespec?"))
    assert isinstance(stream, AsyncStream)
    items = [item async for item in stream]
    # The terminal "[DONE]" event stops iteration and is not yielded.
    assert len(items) == 3
    assert isinstance(items[0], PartialResult) and items[0].text == "partial one"
    assert isinstance(items[1], PartialResult) and items[1].text == "partial two"
    assert isinstance(items[2], FinalResult) and items[2].references == ["doc1", "doc2"]


# ---------------------------------------------------------------------------
# Named / model terminal events (yield-then-stop) -- see the sync test module
# for the rationale. Driven through the generated ``AsyncStream`` with a fake
# response because no published Spector spec produces named-model terminals.
# ---------------------------------------------------------------------------


class _FakeAsyncResponse:
    """A minimal AsyncHttpResponse-shaped stand-in that replays SSE bytes."""

    def __init__(self, body: bytes):
        self.headers = {"Content-Type": "text/event-stream"}
        self._body = body
        self.closed = False

    def iter_bytes(self):
        async def gen():
            for index in range(0, len(self._body), 8):
                yield self._body[index : index + 8]

        return gen()

    async def close(self):
        self.closed = True


def _event_kind(_response, event):
    return (event.event, json.loads(event.data))


_NAMED_TERMINAL_SSE = (
    b'event: response.partial\ndata: {"text": "one"}\n\n'
    b'event: response.delta\ndata: {"delta": "hi"}\n\n'
    b'event: response.completed\ndata: {"references": []}\n\n'
    b'event: response.delta\ndata: {"delta": "AFTER-TERMINAL"}\n\n'
)

_TERMINAL_EVENT_NAMES = ["response.completed", "error"]


@pytest.mark.asyncio
async def test_named_terminal_event_yields_then_stops():
    response = _FakeAsyncResponse(_NAMED_TERMINAL_SSE)
    stream = AsyncStream(
        response=response,
        deserialization_callback=_event_kind,
        terminal_event_names=_TERMINAL_EVENT_NAMES,
    )
    items = [item async for item in stream]
    # The named terminal `response.completed` IS yielded, then iteration stops.
    assert items == [
        ("response.partial", {"text": "one"}),
        ("response.delta", {"delta": "hi"}),
        ("response.completed", {"references": []}),
    ]
    assert response.closed


@pytest.mark.asyncio
async def test_sentinel_and_named_terminal_coexist():
    body = (
        b'event: response.delta\ndata: {"delta": "a"}\n\n'
        b"data: [DONE]\n\n"
        b'event: response.delta\ndata: {"delta": "AFTER-DONE"}\n\n'
    )
    response = _FakeAsyncResponse(body)
    stream = AsyncStream(
        response=response,
        deserialization_callback=_event_kind,
        terminal_event="[DONE]",
        terminal_event_names=_TERMINAL_EVENT_NAMES,
    )
    items = [item async for item in stream]
    # The bare `[DONE]` sentinel stops iteration WITHOUT being yielded.
    assert items == [("response.delta", {"delta": "a"})]
    assert response.closed


@pytest.mark.asyncio
async def test_sse_protocol_metadata_is_available_for_reconnect():
    body = b'id: event-1\nretry: 1000\nevent: message\ndata: {"message": "hello"}\n\n'
    response = _FakeAsyncResponse(body)
    stream = AsyncStream(response=response, deserialization_callback=lambda _response, event: event.data)

    assert [item async for item in stream] == ['{"message": "hello"}']
    assert stream.last_event_id == "event-1"
    assert stream.retry == 1000


@pytest.mark.asyncio
async def test_sse_protocol_invalid_metadata_is_ignored():
    body = b"id: invalid\x00id\nretry: not-a-number\nevent: message\ndata: hello\n\n"
    response = _FakeAsyncResponse(body)
    stream = AsyncStream(response=response, deserialization_callback=lambda _response, event: event.data)

    assert [item async for item in stream] == ["hello"]
    assert stream.last_event_id == ""
    assert stream.retry is None


@pytest.mark.asyncio
async def test_sse_reconnects_on_eof_using_latest_metadata():
    responses = [
        _FakeAsyncResponse(b"id: first\nretry: 0\ndata: one\n\n"),
        _FakeAsyncResponse(b"id: second\ndata: two\n\ndata: [DONE]\n\n"),
    ]
    reconnect_ids = []

    async def reconnect(last_event_id):
        reconnect_ids.append(last_event_id)
        return responses.pop(0)

    stream = AsyncStream(
        response=responses.pop(0),
        deserialization_callback=lambda _response, event: event.data,
        terminal_event="[DONE]",
        reconnect_callback=reconnect,
    )

    assert [item async for item in stream] == ["one", "two"]
    assert reconnect_ids == ["first"]
    assert stream.last_event_id == "second"


@pytest.mark.asyncio
async def test_sse_does_not_reconnect_without_retry_or_after_terminal():
    response = _FakeAsyncResponse(b"id: first\ndata: one\n\n")

    async def reconnect(_last_event_id):
        pytest.fail("unexpected reconnect")

    stream = AsyncStream(
        response=response, deserialization_callback=lambda _response, event: event.data, reconnect_callback=reconnect
    )
    assert [item async for item in stream] == ["one"]

    response = _FakeAsyncResponse(b"retry: 0\ndata: one\n\ndata: [DONE]\n\n")
    stream = AsyncStream(
        response=response,
        deserialization_callback=lambda _response, event: event.data,
        terminal_event="[DONE]",
        reconnect_callback=reconnect,
    )
    assert [item async for item in stream] == ["one"]
