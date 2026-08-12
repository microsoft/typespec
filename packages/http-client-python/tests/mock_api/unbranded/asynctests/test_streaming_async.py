# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest

from streaming.jsonl.aio import JsonlClient
from streaming.sse.aio import SseClient


@pytest.mark.asyncio
async def test_jsonl_response_remains_raw_bytes():
    async with JsonlClient(endpoint="http://localhost:3000") as client:
        payload = b"".join([chunk async for chunk in await client.basic.receive()])

    assert payload == b'{"desc": "one"}\n{"desc": "two"}\n{"desc": "three"}'


@pytest.mark.asyncio
async def test_sse_response_remains_raw_bytes():
    async with SseClient(endpoint="http://localhost:3000") as client:
        payload = b"".join([chunk async for chunk in await client.named.receive()])

    assert b"event: responseCreated" in payload
    assert b"data: [DONE]" in payload
