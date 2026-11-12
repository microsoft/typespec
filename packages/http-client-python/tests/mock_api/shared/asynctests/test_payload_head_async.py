# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
import pytest_asyncio
from payload.head.aio import HeadClient


@pytest_asyncio.fixture
async def client():
    async with HeadClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_content_type_header_in_response(client: HeadClient):
    assert await client.content_type_header_in_response() is True


@pytest.mark.asyncio
async def test_content_type_header_in_response_with_cls(client: HeadClient):
    headers = await client.content_type_header_in_response(cls=lambda x, y, z: z)
    assert headers["Content-Type"] == "text/plain; charset=utf-8"
    assert headers["x-ms-meta"] == "hello"
