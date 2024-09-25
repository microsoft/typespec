# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from payload.mediatype.aio import MediaTypeClient


@pytest.fixture
async def client():
    async with MediaTypeClient(endpoint="http://localhost:3000") as client:
        yield client


@pytest.mark.asyncio
async def test_json(client: MediaTypeClient):
    data = "foo"
    await client.string_body.send_as_json(data)
    assert await client.string_body.get_as_json() == data


@pytest.mark.asyncio
async def test_text(client: MediaTypeClient):
    data = "{cat}"
    await client.string_body.send_as_text(data)
    assert await client.string_body.get_as_text() == data
