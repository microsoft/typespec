# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio

from streaming.jsonl.aio import JsonlClient
from streaming.jsonl._utils.streaming_base import AsyncStream
from streaming.jsonl.basic.models import Info


@pytest_asyncio.fixture
async def client():
    async with JsonlClient(endpoint="http://localhost:3000") as client:
        yield client


JSONL = b'{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'


@pytest.mark.asyncio
async def test_basic_send(client: JsonlClient):
    await client.basic.send(JSONL)


@pytest.mark.asyncio
async def test_basic_recv(client: JsonlClient):
    stream = await client.basic.receive()
    assert isinstance(stream, AsyncStream)
    items = [item async for item in stream]
    assert all(isinstance(item, Info) for item in items)
    assert [item.desc for item in items] == ["one", "two", "three"]
