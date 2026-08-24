# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import json

import pytest

from streaming.sse import SseClient
from streaming.sse._utils.streaming_base import Stream
from streaming.sse.named.models import ResponseCreated, ResponseDelta
from streaming.sse.retrieve.models import FinalResult, PartialResult, RetrievalRequest
from streaming.sse.unnamed.models import Info


@pytest.fixture
def client():
    with SseClient(endpoint="http://localhost:3000") as client:
        yield client


def test_unnamed_receive(client: SseClient):
    stream = client.unnamed.receive()
    assert isinstance(stream, Stream)
    items = list(stream)
    assert all(isinstance(item, Info) for item in items)
    assert [item.desc for item in items] == ["one", "two", "three"]


def test_named_receive(client: SseClient):
    stream = client.named.receive()
    assert isinstance(stream, Stream)
    items = list(stream)
    # The terminal "[DONE]" event stops iteration and is not yielded.
    assert len(items) == 3
    assert isinstance(items[0], ResponseCreated) and items[0].id == "resp_1"
    assert isinstance(items[1], ResponseDelta) and items[1].delta == "Hello"
    assert isinstance(items[2], ResponseDelta) and items[2].delta == " world"


def test_retrieve_stream(client: SseClient):
    stream = client.retrieve.stream(RetrievalRequest(query="what is typespec?"))
    assert isinstance(stream, Stream)
    items = list(stream)
    # The terminal "[DONE]" event stops iteration and is not yielded.
    assert len(items) == 3
    assert isinstance(items[0], PartialResult) and items[0].text == "partial one"
    assert isinstance(items[1], PartialResult) and items[1].text == "partial two"
    assert isinstance(items[2], FinalResult) and items[2].references == ["doc1", "doc2"]


# ---------------------------------------------------------------------------
# Named / model terminal events (yield-then-stop).
#
# The published Spector SSE specs only cover the bare string-constant `[DONE]`
# sentinel (drop-and-stop, exercised above). A ``@terminalEvent`` can also be a
# *named* event carrying a model payload (e.g. `response.completed`, `error`):
# such an event IS deserialized and yielded, and iteration stops immediately
# afterwards. No published spec produces that shape, so we drive the generated
# ``Stream`` runtime directly with a fake response instead of the mock server.
# ---------------------------------------------------------------------------


class _FakeResponse:
    """A minimal HttpResponse-shaped stand-in that replays SSE bytes."""

    def __init__(self, body: bytes):
        self.headers = {"Content-Type": "text/event-stream"}
        self._body = body
        self.closed = False

    def iter_bytes(self):
        # Emit in small chunks so incremental SSE framing is exercised.
        for index in range(0, len(self._body), 8):
            yield self._body[index : index + 8]

    def close(self):
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


def test_named_terminal_event_yields_then_stops():
    response = _FakeResponse(_NAMED_TERMINAL_SSE)
    stream = Stream(
        response=response,
        deserialization_callback=_event_kind,
        terminal_event_names=_TERMINAL_EVENT_NAMES,
    )
    items = list(stream)
    # The named terminal `response.completed` IS yielded (it carries a payload),
    # then iteration stops -- the trailing `response.delta` must not appear.
    assert items == [
        ("response.partial", {"text": "one"}),
        ("response.delta", {"delta": "hi"}),
        ("response.completed", {"references": []}),
    ]
    assert response.closed


def test_named_terminal_event_first_stops_immediately():
    body = b'event: error\ndata: {"code": "boom"}\n\n' b'event: response.delta\ndata: {"delta": "AFTER-ERROR"}\n\n'
    response = _FakeResponse(body)
    stream = Stream(
        response=response,
        deserialization_callback=_event_kind,
        terminal_event_names=_TERMINAL_EVENT_NAMES,
    )
    items = list(stream)
    assert items == [("error", {"code": "boom"})]
    assert response.closed


def test_sentinel_and_named_terminal_coexist():
    body = (
        b'event: response.delta\ndata: {"delta": "a"}\n\n'
        b"data: [DONE]\n\n"
        b'event: response.delta\ndata: {"delta": "AFTER-DONE"}\n\n'
    )
    response = _FakeResponse(body)
    stream = Stream(
        response=response,
        deserialization_callback=_event_kind,
        terminal_event="[DONE]",
        terminal_event_names=_TERMINAL_EVENT_NAMES,
    )
    items = list(stream)
    # The bare `[DONE]` sentinel stops iteration WITHOUT being yielded.
    assert items == [("response.delta", {"delta": "a"})]
    assert response.closed


def test_sse_protocol_metadata_is_available_for_reconnect():
    body = b'id: event-1\nretry: 1000\nevent: message\ndata: {"message": "hello"}\n\n'
    response = _FakeResponse(body)
    stream = Stream(response=response, deserialization_callback=lambda _response, event: event.data)

    assert list(stream) == ['{"message": "hello"}']
    assert stream.last_event_id == "event-1"
    assert stream.retry == 1000


def test_sse_protocol_invalid_metadata_is_ignored():
    body = b"id: invalid\x00id\nretry: not-a-number\nevent: message\ndata: hello\n\n"
    response = _FakeResponse(body)
    stream = Stream(response=response, deserialization_callback=lambda _response, event: event.data)

    assert list(stream) == ["hello"]
    assert stream.last_event_id == ""
    assert stream.retry is None


def test_sse_reconnects_on_eof_using_latest_metadata():
    responses = [
        _FakeResponse(b"id: first\nretry: 0\ndata: one\n\n"),
        _FakeResponse(b"id: second\ndata: two\n\ndata: [DONE]\n\n"),
    ]
    reconnect_ids = []

    def reconnect(last_event_id):
        reconnect_ids.append(last_event_id)
        return responses.pop(0)

    stream = Stream(
        response=responses.pop(0),
        deserialization_callback=lambda _response, event: event.data,
        terminal_event="[DONE]",
        reconnect_callback=reconnect,
    )

    assert list(stream) == ["one", "two"]
    assert reconnect_ids == ["first"]
    assert stream.last_event_id == "second"


def test_sse_does_not_reconnect_without_retry_or_after_terminal():
    response = _FakeResponse(b"id: first\ndata: one\n\n")
    reconnect = lambda _last_event_id: pytest.fail("unexpected reconnect")
    stream = Stream(
        response=response, deserialization_callback=lambda _response, event: event.data, reconnect_callback=reconnect
    )
    assert list(stream) == ["one"]

    response = _FakeResponse(b"retry: 0\ndata: one\n\ndata: [DONE]\n\n")
    stream = Stream(
        response=response,
        deserialization_callback=lambda _response, event: event.data,
        terminal_event="[DONE]",
        reconnect_callback=reconnect,
    )
    assert list(stream) == ["one"]
