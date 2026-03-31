# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.empty.aio import EmptyClient
from typetest.model.empty.models import EmptyInput, EmptyOutput, EmptyInputOutput


@pytest.fixture
async def client():
    async with EmptyClient() as client:
        yield client


@pytest.mark.asyncio
async def test_put(client: EmptyClient):
    await client.put_empty(EmptyInput())
    await client.put_empty({})


@pytest.mark.asyncio
async def test_get(client: EmptyClient):
    assert await client.get_empty() == EmptyOutput()
    assert await client.get_empty() == {}


@pytest.mark.asyncio
async def test_post_round(client: EmptyClient):
    assert await client.post_round_trip_empty(EmptyInputOutput()) == EmptyInputOutput()
    assert await client.post_round_trip_empty({}) == {}
