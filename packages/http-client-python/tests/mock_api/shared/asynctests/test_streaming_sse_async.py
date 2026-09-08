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
from streaming.sse.protocol.data.models import WithEnvelope1
from streaming.sse.protocol.models import Info as ProtocolInfo
from streaming.sse.retrieve.models import FinalResult, PartialResult, RetrievalRequest
from streaming.sse.unnamed.models import Info


@pytest_asyncio.fixture
async def client():
    async with SseClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_unnamed_receive(client: SseClient):
    async with await client.unnamed.receive() as stream:
        assert isinstance(stream, AsyncStream)
        items = [await stream.__anext__() for _ in range(3)]
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


@pytest.mark.asyncio
async def test_protocol_data_with_envelope(client: SseClient):
    async with await client.protocol.data.with_envelope() as stream:
        assert await stream.__anext__() == "hello"


@pytest.mark.asyncio
async def test_protocol_data_without_envelope(client: SseClient):
    async with await client.protocol.data.without_envelope() as stream:
        item = await stream.__anext__()
        assert isinstance(item, WithEnvelope1)
        assert item.metadata == {"source": "test"}
        assert item.contents == "world"


@pytest.mark.asyncio
async def test_protocol_event_id(client: SseClient):
    async with await client.protocol.id() as stream:
        item = await stream.__anext__()
        assert isinstance(item, ProtocolInfo)
        assert item.message == "hello"
        assert stream.last_event_id == "event-1"


@pytest.mark.asyncio
async def test_protocol_invalid_event_id(client: SseClient):
    async with await client.protocol.invalid_id() as stream:
        item = await stream.__anext__()
        assert isinstance(item, ProtocolInfo)
        assert item.message == "hello"
        assert stream.last_event_id == ""


@pytest.mark.asyncio
async def test_protocol_retry(client: SseClient):
    async with await client.protocol.retry() as stream:
        item = await stream.__anext__()
        assert isinstance(item, ProtocolInfo)
        assert item.message == "hello"
        assert stream.retry == 1000


@pytest.mark.asyncio
async def test_protocol_invalid_retry(client: SseClient):
    async with await client.protocol.invalid_retry() as stream:
        item = await stream.__anext__()
        assert isinstance(item, ProtocolInfo)
        assert item.message == "hello"
        assert stream.retry is None


@pytest.mark.asyncio
async def test_protocol_reconnect(client: SseClient):
    async with await client.protocol.reconnect() as stream:
        first = await stream.__anext__()
        assert isinstance(first, ProtocolInfo)
        assert first.message == "hello"
        assert stream.last_event_id == "event-1"

    async with await client.protocol.reconnect(last_event_id="event-1") as stream:
        second = await stream.__anext__()
        assert isinstance(second, ProtocolInfo)
        assert second.message == "world"
        assert stream.last_event_id == "event-2"


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


class _FailingCloseAsyncResponse(_FakeAsyncResponse):
    def iter_bytes(self):
        class _Chunks:
            def __init__(self, body):
                self._body = body
                self._done = False

            def __aiter__(self):
                return self

            async def __anext__(self):
                if self._done:
                    raise StopAsyncIteration
                self._done = True
                return self._body

            async def aclose(self):
                raise RuntimeError("iterator cleanup failed")

        return _Chunks(self._body)


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
async def test_unnamed_terminal_event_yields_then_stops():
    body = b'data: {"status": "done"}\n\n' b'data: {"status": "AFTER-TERMINAL"}\n\n'
    response = _FakeAsyncResponse(body)
    stream = AsyncStream(
        response=response,
        deserialization_callback=_event_kind,
        terminal_event_names=["message"],
    )

    assert [item async for item in stream] == [("message", {"status": "done"})]
    assert response.closed


@pytest.mark.asyncio
async def test_unnamed_terminal_predicate_preserves_service_event_type():
    body = b'data: {"kind": "progress"}\n\n' b'data: {"kind": "complete"}\n\n' b'data: {"kind": "after"}\n\n'
    response = _FakeAsyncResponse(body)
    stream = AsyncStream(
        response=response,
        deserialization_callback=_event_kind,
        terminal_event_predicate=lambda event: json.loads(event.data).get("kind") == "complete",
    )

    assert [item async for item in stream] == [
        ("message", {"kind": "progress"}),
        ("message", {"kind": "complete"}),
    ]
    assert response.closed


@pytest.mark.asyncio
async def test_response_closes_when_async_iterator_cleanup_fails():
    response = _FailingCloseAsyncResponse(b"data: first\n\n")
    stream = AsyncStream(
        response=response,
        deserialization_callback=lambda _response, event: event.data,
    )

    assert await stream.__anext__() == "first"
    with pytest.raises(RuntimeError, match="iterator cleanup failed"):
        await stream.__anext__()
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
async def test_sse_protocol_metadata_is_available():
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
