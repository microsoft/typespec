# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
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
