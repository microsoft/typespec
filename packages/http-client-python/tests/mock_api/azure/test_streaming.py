# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
from streaming.jsonl import JsonlClient
from streaming.jsonl.basic.models import Info as JsonlInfo
from streaming.sse import SseClient
from streaming.sse.named.models import ResponseCreated, ResponseDelta
from streaming.sse.retrieve.models import FinalResult, PartialResult
from streaming.sse.unnamed.models import Info as SseInfo


def test_jsonl_response_yields_models_and_ignores_stream_kwarg():
    with JsonlClient(endpoint="http://localhost:3000") as client:
        items = list(client.basic.receive(stream=False))

    assert all(isinstance(item, JsonlInfo) for item in items)
    assert [item.desc for item in items] == ["one", "two", "three"]


def test_unnamed_sse_response_yields_models():
    with SseClient(endpoint="http://localhost:3000") as client:
        items = list(client.unnamed.receive())

    assert all(isinstance(item, SseInfo) for item in items)
    assert [item.desc for item in items] == ["one", "two", "three"]


def test_named_sse_dispatches_models_stops_at_terminal_and_calls_cls_once():
    calls = []

    def cls(pipeline_response, generator, headers):
        calls.append((pipeline_response, generator, headers))
        return generator

    with SseClient(endpoint="http://localhost:3000") as client:
        generator = client.named.receive(cls=cls)
        items = list(generator)

    assert len(calls) == 1
    assert calls[0][1] is generator
    assert [type(item) for item in items] == [
        ResponseCreated,
        ResponseDelta,
        ResponseDelta,
    ]
    assert items[0].id == "resp_1"
    assert [item.delta for item in items[1:]] == ["Hello", " world"]


def test_request_body_operation_can_return_structured_sse():
    with SseClient(endpoint="http://localhost:3000") as client:
        items = list(client.retrieve.stream({"query": "what is typespec?"}))

    assert [type(item) for item in items] == [
        PartialResult,
        PartialResult,
        FinalResult,
    ]
    assert [item.text for item in items[:2]] == ["partial one", "partial two"]
    assert items[2].references == ["doc1", "doc2"]
