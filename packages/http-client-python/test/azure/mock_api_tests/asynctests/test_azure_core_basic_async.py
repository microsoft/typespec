# -------------------------------------------------------------------------
# Copyright (c) Microsoft Corporation. All rights reserved.
# Licensed under the MIT License. See License.txt in the project root for
# license information.
# --------------------------------------------------------------------------
import pytest
from typing import AsyncIterable
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


async def _list_with_page_tests(pager: AsyncIterable[models.User]):
    result = [p async for p in pager]
    assert len(result) == 1
    assert result[0].id == 1
    assert result[0].name == "Madge"
    assert result[0].etag == "11bdc430-65e8-45ad-81d9-8ffa60d55b59"
    assert result[0].orders is None


@pytest.mark.asyncio
async def test_list_with_page(client: aio.BasicClient):
    await _list_with_page_tests(client.list_with_page())


@pytest.mark.asyncio
async def test_list_with_custom_page_model(client: aio.BasicClient):
    await _list_with_page_tests(client.list_with_custom_page_model())
    with pytest.raises(AttributeError):
        models.CustomPageModel


@pytest.mark.asyncio
async def test_delete(client: aio.BasicClient):
    await client.delete(id=1)


@pytest.mark.asyncio
async def test_export(client: aio.BasicClient):
    result = await client.export(id=1, format="json")
    assert result == VALID_USER


@pytest.mark.asyncio
async def test_list_with_parameters(client: aio.BasicClient):
    result = [
        item
        async for item in client.list_with_parameters(models.ListItemInputBody(input_name="Madge"), another="Second")
    ]
    assert len(result) == 1
    assert result[0] == VALID_USER


@pytest.mark.asyncio
async def test_two_models_as_page_item(client: aio.BasicClient):
    result = [item async for item in client.two_models_as_page_item.list_first_item()]
    assert len(result) == 1
    assert result[0].id == 1

    result = [item async for item in client.two_models_as_page_item.list_second_item()]
    assert len(result) == 1
    assert result[0].name == "Madge"
