# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typetest.model.notdiscriminated.aio import NotDiscriminatedClient
from typetest.model.notdiscriminated.models import Siamese


@pytest.fixture
async def client():
    async with NotDiscriminatedClient() as client:
        yield client


@pytest.fixture
async def valid_body():
    return Siamese(name="abc", age=32, smart=True)


@pytest.mark.asyncio
async def test_get_valid(client, valid_body):
    assert await client.get_valid() == valid_body


@pytest.mark.asyncio
async def test_post_valid(client, valid_body):
    await client.post_valid(valid_body)


@pytest.mark.asyncio
async def test_put_valid(client, valid_body):
    assert valid_body == await client.put_valid(valid_body)
