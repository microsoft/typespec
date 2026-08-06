# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
"""Unbranded JSONL streaming (async): ``receive()`` keeps the byte-iterator behavior.

See the sync counterpart (test_streaming_jsonl_unbranded.py) for context: structured
`Stream[T]` streaming is Azure-only; the unbranded flavor keeps `AsyncIterator[bytes]`.
"""
import pytest
import pytest_asyncio

from streaming.jsonl.aio import JsonlClient


@pytest_asyncio.fixture
async def client():
    async with JsonlClient(endpoint="http://localhost:3000") as client:
        yield client


JSONL = b'{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'


@pytest.mark.asyncio
async def test_basic_recv(client: JsonlClient):
    assert b"".join([d async for d in (await client.basic.receive())]) == JSONL
