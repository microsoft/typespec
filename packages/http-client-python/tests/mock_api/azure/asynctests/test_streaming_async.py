# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest

from streaming.jsonl.aio import JsonlClient
from streaming.jsonl.basic.models import Info as JsonlInfo
from streaming.sse.aio import SseClient
from streaming.sse.named.models import ResponseCreated, ResponseDelta
from streaming.sse.unnamed.models import Info as SseInfo


@pytest.mark.asyncio
async def test_jsonl_response_yields_models_and_ignores_stream_kwarg():
    async with JsonlClient(endpoint="http://localhost:3000") as client:
        items = [item async for item in await client.basic.receive(stream=False)]

    assert all(isinstance(item, JsonlInfo) for item in items)
    assert [item.desc for item in items] == ["one", "two", "three"]


@pytest.mark.asyncio
async def test_unnamed_sse_response_yields_models():
    async with SseClient(endpoint="http://localhost:3000") as client:
        items = [item async for item in await client.unnamed.receive()]

    assert all(isinstance(item, SseInfo) for item in items)
    assert [item.desc for item in items] == ["one", "two", "three"]


@pytest.mark.asyncio
async def test_named_sse_dispatches_models_stops_at_terminal_and_calls_cls_once():
    calls = []

    def cls(pipeline_response, generator, headers):
        calls.append((pipeline_response, generator, headers))
        return generator

    async with SseClient(endpoint="http://localhost:3000") as client:
        generator = await client.named.receive(cls=cls)
        items = [item async for item in generator]

    assert len(calls) == 1
    assert calls[0][1] is generator
    assert [type(item) for item in items] == [
        ResponseCreated,
        ResponseDelta,
        ResponseDelta,
    ]
    assert items[0].id == "resp_1"
    assert [item.delta for item in items[1:]] == ["Hello", " world"]
