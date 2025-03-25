# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest

from streaming.jsonl.aio import JsonlClient


@pytest.fixture
async def client():
    async with JsonlClient(endpoint="http://localhost:3000") as client:
        yield client


JSONL = b'{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'


@pytest.mark.asyncio
async def test_basic_send(client: JsonlClient):
    await client.basic.send(JSONL)


@pytest.mark.asyncio
async def test_basic_recv(client: JsonlClient):
    assert b"".join([d async for d in (await client.basic.receive())]) == JSONL
