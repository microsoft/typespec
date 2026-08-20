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
