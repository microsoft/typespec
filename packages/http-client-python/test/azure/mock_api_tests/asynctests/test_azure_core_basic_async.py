# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from specs.azure.core.basic import models, aio

VALID_USER = models.User(id=1, name="Madge", etag="11bdc430-65e8-45ad-81d9-8ffa60d55b59")


@pytest.fixture
async def client():
    async with aio.BasicClient() as client:
        yield client


@pytest.mark.asyncio
async def test_create_or_update(client: aio.BasicClient):
    result = await client.create_or_update(id=1, resource={"name": "Madge"})
    assert result == VALID_USER


@pytest.mark.asyncio
async def test_create_or_replace(client: aio.BasicClient):
    result = await client.create_or_replace(id=1, resource={"name": "Madge"})
    assert result == VALID_USER


@pytest.mark.asyncio
async def test_get(client: aio.BasicClient):
    result = await client.get(id=1)
    assert result == VALID_USER


@pytest.mark.asyncio
async def test_list(client: aio.BasicClient):
    result = client.list(
        top=5,
        skip=10,
        orderby=["id"],
        filter="id lt 10",
        select=["id", "orders", "etag"],
        expand=["orders"],
    )
    result = [item async for item in result]
    assert len(result) == 2
    assert result[0].id == 1
    assert result[0].name == "Madge"
    assert result[0].etag == "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
    assert result[0].orders[0].id == 1
    assert result[0].orders[0].user_id == 1
    assert result[0].orders[0].detail == "a recorder"
    assert result[1].id == 2
    assert result[1].name == "John"
    assert result[1].etag == "11bdc430-65e8-45ad-81d9-8ffa60d55b5a"
    assert result[1].orders[0].id == 2
    assert result[1].orders[0].user_id == 2
    assert result[1].orders[0].detail == "a TV"


@pytest.mark.asyncio
async def test_delete(client: aio.BasicClient):
    await client.delete(id=1)


@pytest.mark.asyncio
async def test_export(client: aio.BasicClient):
    result = await client.export(id=1, format="json")
    assert result == VALID_USER


@pytest.mark.asyncio
async def test_export_all_users(client: aio.BasicClient):
    result = await client.export_all_users(format="json")
    assert result.users[0] == VALID_USER
